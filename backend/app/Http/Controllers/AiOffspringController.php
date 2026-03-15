<?php

namespace App\Http\Controllers;

use App\Models\AiGenerationLog;
use App\Models\Pet;
use App\Models\PetPhoto;
use App\Services\GeminiImageService;
use Illuminate\Support\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AiOffspringController extends Controller
{
    private GeminiImageService $geminiImageService;

    public function __construct(GeminiImageService $geminiImageService)
    {
        $this->geminiImageService = $geminiImageService;
    }

    /**
     * Generate an AI-predicted offspring image for two pets.
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'pet1_id' => 'required|exists:pets,pet_id',
            'pet2_id' => 'required|exists:pets,pet_id',
            'source_mode' => 'nullable|in:primary,count',
            'source_photo_count' => 'nullable|integer|min:1|max:3',
        ]);

        $user = $request->user();

        $sourceMode = (string) ($request->input('source_mode') ?: 'primary');
        $sourcePhotoCountInput = $request->input('source_photo_count');
        $sourcePhotoCount = $sourceMode === 'count'
            ? (is_numeric($sourcePhotoCountInput) ? (int) $sourcePhotoCountInput : 2)
            : 1;

        // --- Rate limit check based on subscription tier ---
        $tier = $user->subscription_tier ?? 'free';
        $maxGenerations = config("subscription.tiers.{$tier}.features.max_ai_generations_per_day", 1);

        $todayCount = DB::table('ai_generation_logs')
            ->where('user_id', $user->id)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        if ($todayCount >= $maxGenerations) {
            return response()->json([
                'success' => false,
                'message' => "Daily AI generation limit reached ({$maxGenerations} per day for {$tier} tier).",
                'remaining_generations' => 0,
            ], 429);
        }

        // --- Load pets ---
        $pet1 = Pet::with('photos')->findOrFail($request->input('pet1_id'));
        $pet2 = Pet::with('photos')->findOrFail($request->input('pet2_id'));

        $pet1SelectedPhotos = $this->selectSourcePhotos($pet1, $sourceMode, $sourcePhotoCount);
        $pet2SelectedPhotos = $this->selectSourcePhotos($pet2, $sourceMode, $sourcePhotoCount);

        $effectiveCount = min($pet1SelectedPhotos->count(), $pet2SelectedPhotos->count());

        $pet1SelectedPhotos = $pet1SelectedPhotos->take($effectiveCount)->values();
        $pet2SelectedPhotos = $pet2SelectedPhotos->take($effectiveCount)->values();

        if ($effectiveCount < 1) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to generate offspring image. Please upload pet photos and ensure each parent has at least one usable photo.',
            ], 422);
        }

        $pet1PhotoUrls = $this->selectedPhotosToPublicUrls($pet1SelectedPhotos);
        $pet2PhotoUrls = $this->selectedPhotosToPublicUrls($pet2SelectedPhotos);

        if (empty($pet1PhotoUrls) || empty($pet2PhotoUrls)) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to generate offspring image. Please upload pet photos and ensure each parent has at least one usable photo.',
            ], 422);
        }

        $photoDrivenPromptResult = $this->geminiImageService->buildPhotoDrivenOffspringPrompt(
            $pet1PhotoUrls,
            $pet2PhotoUrls,
            [
                'species' => $pet1->species,
                'breed1' => $pet1->breed,
                'breed2' => $pet2->breed,
                'attributes' => array_values(array_unique(array_map(
                    'strtolower',
                    array_merge(
                        is_array($pet1->attributes) ? $pet1->attributes : [],
                        is_array($pet2->attributes) ? $pet2->attributes : []
                    )
                ))),
            ]
        );

        $prompt = $photoDrivenPromptResult['success'] ?? false
            ? (string) ($photoDrivenPromptResult['prompt'] ?? '')
            : '';

        if ($prompt === '') {
            $prompt = $this->buildFallbackTraitPrompt($pet1, $pet2);
        }

        // --- Call Gemini API ---
        $result = $this->geminiImageService->generateImage($prompt);

        if (! $result['success']) {
            $statusCode = str_contains($result['error'] ?? '', 'unavailable') ? 503 : 500;

            return response()->json([
                'success' => false,
                'message' => $result['error'],
            ], $statusCode);
        }

        // --- Decode and save image to DO Spaces ---
        try {
            $imageData = base64_decode($result['b64_json']);
            $filename = 'ai-offspring/' . Str::uuid() . '.png';

            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('do_spaces');
            $disk->put($filename, $imageData, 'public');
            $imageUrl = $disk->url($filename);
        } catch (\Exception $e) {
            Log::error('Failed to save AI offspring image to storage', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save generated image.',
            ], 500);
        }

        // --- Insert log record ---
        $generationLog = AiGenerationLog::create([
            'user_id' => $user->id,
            'pet1_id' => $request->input('pet1_id'),
            'pet2_id' => $request->input('pet2_id'),
            'image_path' => $filename,
            'prompt_used' => $prompt,
            'source_mode' => $sourceMode,
            'source_photo_count' => $effectiveCount,
            'source_photo_ids' => [
                'parent1' => $pet1SelectedPhotos->pluck('id')->values()->all(),
                'parent2' => $pet2SelectedPhotos->pluck('id')->values()->all(),
            ],
        ]);

        $remaining = $maxGenerations - ($todayCount + 1);

        return response()->json([
            'success' => true,
            'generation_id' => $generationLog->id,
            'image_url' => $imageUrl,
            'prompt_used' => $prompt,
            'remaining_generations' => $remaining,
            'source_mode' => $sourceMode,
            'source_photo_count' => $effectiveCount,
        ]);
    }

    /**
     * List AI offspring generation history for the authenticated user.
     */
    public function history(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(1, min(50, $perPage));

        $logs = AiGenerationLog::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'pet1.photos',
                'pet2.photos',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $data = collect($logs->items())
            ->map(fn (AiGenerationLog $item) => $this->transformHistoryItem($item))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Delete a user-owned generation history entry.
     */
    public function deleteHistory(Request $request, int $id): JsonResponse
    {
        $generation = AiGenerationLog::query()
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $generation) {
            return response()->json([
                'success' => false,
                'message' => 'Generation history item not found.',
            ], 404);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('do_spaces');

        if (! empty($generation->image_path) && $disk->exists($generation->image_path)) {
            $disk->delete($generation->image_path);
        }

        $generation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Generation history item deleted successfully.',
        ]);
    }

    /**
     * Select source photos based on source mode and requested photo count.
     *
     * @return Collection<int, PetPhoto>
     */
    private function selectSourcePhotos(Pet $pet, string $sourceMode, ?int $sourcePhotoCount = null): Collection
    {
        /** @var Collection<int, PetPhoto> $photos */
        $photos = $pet->photos instanceof Collection
            ? $pet->photos
            : collect();

        if ($photos->isEmpty()) {
            return collect();
        }

        if ($sourceMode === 'count') {
            $count = max(1, min(3, (int) ($sourcePhotoCount ?? 2)));

            return $photos
                ->sort(function (PetPhoto $a, PetPhoto $b) {
                    if ((bool) $a->is_primary !== (bool) $b->is_primary) {
                        return $a->is_primary ? -1 : 1;
                    }

                    return ((int) $a->id) <=> ((int) $b->id);
                })
                ->take($count)
                ->values();
        }

        $primary = $photos->firstWhere('is_primary', true);

        if ($primary) {
            return collect([$primary]);
        }

        $first = $photos
            ->sortBy(fn (PetPhoto $photo) => (int) $photo->id)
            ->first();

        return $first ? collect([$first]) : collect();
    }

    /**
     * Convert selected pet photos to public URLs.
     *
     * @param  Collection<int, PetPhoto>  $selectedPhotos
     * @return array<int, string>
     */
    private function selectedPhotosToPublicUrls(Collection $selectedPhotos): array
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('do_spaces');

        return $selectedPhotos
            ->map(function (PetPhoto $photo) use ($disk): ?string {
                $path = (string) ($photo->photo_url ?? '');

                if ($path === '') {
                    return null;
                }

                if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                    return $path;
                }

                return $disk->url($path);
            })
            ->filter(fn (?string $url) => ! empty($url))
            ->values()
            ->all();
    }

    /**
     * Build fallback trait-based prompt without using description text.
     */
    private function buildFallbackTraitPrompt(Pet $pet1, Pet $pet2): string
    {
        $species1 = trim((string) ($pet1->species ?? ''));
        $species2 = trim((string) ($pet2->species ?? ''));

        if ($species1 !== '' && $species2 !== '' && strcasecmp($species1, $species2) === 0) {
            $species = strtolower($species1);
        } elseif ($species1 !== '') {
            $species = strtolower($species1);
        } elseif ($species2 !== '') {
            $species = strtolower($species2);
        } else {
            $species = 'pet';
        }

        $breed1 = trim((string) ($pet1->breed ?? 'mixed')) ?: 'mixed';
        $breed2 = trim((string) ($pet2->breed ?? 'mixed')) ?: 'mixed';

        $attributes1 = is_array($pet1->attributes) ? $pet1->attributes : [];
        $attributes2 = is_array($pet2->attributes) ? $pet2->attributes : [];

        $mergedAttributes = array_values(array_unique(array_map(
            'strtolower',
            array_merge($attributes1, $attributes2)
        )));

        $attributesText = ! empty($mergedAttributes)
            ? implode(', ', $mergedAttributes)
            : 'balanced inherited features';

        return "A photorealistic {$species} offspring blending {$breed1} and {$breed2} traits, {$attributesText}, clear facial detail, natural fur texture, balanced inherited visual characteristics, studio lighting";
    }

    /**
     * Transform a generation log record into API response format.
     *
     * @return array<string, mixed>
     */
    private function transformHistoryItem(AiGenerationLog $generation): array
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('do_spaces');

        $imageUrl = $generation->image_path;

        if (! empty($imageUrl) && ! str_starts_with($imageUrl, 'http://') && ! str_starts_with($imageUrl, 'https://')) {
            $imageUrl = $disk->url($imageUrl);
        }

        return [
            'id' => $generation->id,
            'image_url' => $imageUrl,
            'prompt_used' => $generation->prompt_used,
            'source_mode' => $generation->source_mode,
            'source_photo_count' => $generation->source_photo_count,
            'created_at' => $generation->created_at?->toISOString(),
            'pet1' => $this->transformHistoryPetSummary($generation->pet1),
            'pet2' => $this->transformHistoryPetSummary($generation->pet2),
        ];
    }

    /**
     * Transform pet summary for history payload.
     *
     * @return array<string, mixed>|null
     */
    private function transformHistoryPetSummary(?Pet $pet): ?array
    {
        if (! $pet) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('do_spaces');

        $profileImage = $pet->primary_photo_url;

        if (! $profileImage && ! empty($pet->profile_image)) {
            $profileImage = str_starts_with($pet->profile_image, 'http://') || str_starts_with($pet->profile_image, 'https://')
                ? $pet->profile_image
                : $disk->url($pet->profile_image);
        }

        return [
            'pet_id' => $pet->pet_id,
            'name' => $pet->name,
            'breed' => $pet->breed,
            'profile_image' => $profileImage,
        ];
    }
}
