<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Services\GeminiImageService;
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
        ]);

        $user = $request->user();

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
        $pet1 = Pet::findOrFail($request->input('pet1_id'));
        $pet2 = Pet::findOrFail($request->input('pet2_id'));

        // --- Build prompt ---
        $species = $pet1->species ?? 'pet';
        $breed1 = $pet1->breed ?? 'mixed';
        $breed2 = $pet2->breed ?? 'mixed';

        $attributes1 = is_array($pet1->attributes) ? $pet1->attributes : [];
        $attributes2 = is_array($pet2->attributes) ? $pet2->attributes : [];
        $mergedAttributes = array_values(array_unique(
            array_map('strtolower', array_merge($attributes1, $attributes2))
        ));
        $attributesStr = ! empty($mergedAttributes) ? implode(', ', $mergedAttributes) : 'cute, fluffy';

        $prompt = "A cute {$species} baby, {$breed1} x {$breed2} mix, {$attributesStr}, adorable, photorealistic, studio lighting";

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
        DB::table('ai_generation_logs')->insert([
            'user_id' => $user->id,
            'pet1_id' => $request->input('pet1_id'),
            'pet2_id' => $request->input('pet2_id'),
            'image_path' => $filename,
            'prompt_used' => $prompt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $remaining = $maxGenerations - ($todayCount + 1);

        return response()->json([
            'success' => true,
            'image_url' => $imageUrl,
            'prompt_used' => $prompt,
            'remaining_generations' => $remaining,
        ]);
    }
}
