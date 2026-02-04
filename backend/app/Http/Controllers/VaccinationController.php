<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\VaccinationCard;
use App\Models\VaccinationShot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class VaccinationController extends Controller
{
    /**
     * Get all vaccination cards for a pet
     */
    public function getCards($petId)
    {
        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $cards = $pet->vaccinationCards()
            ->with(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }])
            ->get();

        $formattedCards = $cards->map(function ($card) {
            return $this->formatCardResponse($card);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'required' => $formattedCards->where('is_required', true)->values(),
                'optional' => $formattedCards->where('is_required', false)->values(),
            ],
        ]);
    }

    /**
     * Get a specific vaccination card with all shots
     */
    public function getCard($petId, $cardId)
    {
        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $card = VaccinationCard::where('card_id', $cardId)
            ->where('pet_id', $petId)
            ->with(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $this->formatCardResponse($card),
        ]);
    }

    /**
     * Add a new shot to a vaccination card
     */
    public function addShot(Request $request, $petId, $cardId)
    {
        $validated = $request->validate([
            'vaccination_record' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'clinic_name' => 'required|string|max:255',
            'veterinarian_name' => 'required|string|max:255',
            'date_administered' => 'required|date|before_or_equal:today',
            'expiration_date' => 'required|date|after:date_administered',
            'shot_number' => 'nullable|integer|min:1',
        ], [
            'vaccination_record.required' => 'Proof document is required.',
            'vaccination_record.mimes' => 'Document must be an image (JPG, PNG) or PDF.',
            'clinic_name.required' => 'Clinic name is required.',
            'veterinarian_name.required' => 'Veterinarian name is required.',
            'date_administered.required' => 'Date administered is required.',
            'date_administered.before_or_equal' => 'Date administered cannot be in the future.',
            'expiration_date.required' => 'Expiration date is required.',
            'expiration_date.after' => 'Expiration date must be after date administered.',
            'shot_number.integer' => 'Shot number must be a valid number.',
            'shot_number.min' => 'Shot number must be at least 1.',
        ]);

        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $card = VaccinationCard::where('card_id', $cardId)
            ->where('pet_id', $petId)
            ->firstOrFail();

        try {
            DB::beginTransaction();

            // Store the document
            $documentPath = $request->file('vaccination_record')->store('vaccinations', 'do_spaces');

            // Create the shot
            $shot = VaccinationShot::createForCard(
                $card,
                $documentPath,
                $validated['clinic_name'],
                $validated['veterinarian_name'],
                $validated['date_administered'],
                $validated['expiration_date'],
                $validated['shot_number'] ?? null
            );

            DB::commit();

            // Reload the card with shots
            $card->load(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }]);

            return response()->json([
                'success' => true,
                'message' => 'Shot added successfully',
                'data' => [
                    'shot' => $shot->toApiArray(),
                    'card' => $this->formatCardResponse($card),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to add shot',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a custom (optional) vaccination card for a pet
     */
    public function createCustomCard(Request $request, $petId)
    {
        $validated = $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'total_shots' => 'nullable|integer|min:1|max:20',
            'recurrence_type' => 'nullable|in:none,recurring,yearly,biannual',
        ]);

        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        try {
            $card = VaccinationCard::createCustomCard(
                $petId,
                $validated['vaccine_name'],
                $validated['total_shots'] ?? 1,
                $validated['recurrence_type'] ?? 'none'
            );

            return response()->json([
                'success' => true,
                'message' => 'Vaccination type added successfully',
                'data' => $this->formatCardResponse($card),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vaccination type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Initialize required vaccination cards for a pet
     * Called when pet is created
     */
    public function initializeRequiredCards($petId)
    {
        $pet = Pet::findOrFail($petId);

        // Check if cards already exist
        if ($pet->vaccinationCards()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Vaccination cards already initialized for this pet',
            ], 400);
        }

        try {
            $cards = VaccinationCard::createRequiredCardsForPet($petId);

            return response()->json([
                'success' => true,
                'message' => 'Vaccination cards initialized successfully',
                'data' => collect($cards)->map(fn($card) => $this->formatCardResponse($card)),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize vaccination cards',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get vaccination summary for a pet (for display on pet profile)
     */
    public function getSummary($petId)
    {
        $pet = Pet::with(['vaccinationCards.shots'])->findOrFail($petId);

        $cards = $pet->vaccinationCards;

        $summary = [
            'total_cards' => $cards->count(),
            'completed_cards' => $cards->where('status', 'completed')->count(),
            'in_progress_cards' => $cards->where('status', 'in_progress')->count(),
            'overdue_cards' => $cards->where('status', 'overdue')->count(),
            'overall_status' => $this->calculateOverallStatus($cards),
            'cards' => $cards->map(function ($card) {
                return [
                    'card_id' => $card->card_id,
                    'vaccine_name' => $card->vaccine_name,
                    'is_required' => $card->is_required,
                    'status' => $card->status,
                    'progress' => $card->progress_percentage,
                    'completed_shots' => $card->completed_shots_count,
                    'total_shots' => $card->total_shots_required,
                    'next_shot_date' => $card->calculateNextShotDate()?->format('Y-m-d'),
                ];
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Delete a custom vaccination card (only optional cards can be deleted)
     */
    public function deleteCard($petId, $cardId)
    {
        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $card = VaccinationCard::where('card_id', $cardId)
            ->where('pet_id', $petId)
            ->firstOrFail();

        if ($card->is_required) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete required vaccination cards',
            ], 400);
        }

        try {
            $card->delete();

            return response()->json([
                'success' => true,
                'message' => 'Vaccination card deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete vaccination card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format a vaccination card for API response
     */
    private function formatCardResponse(VaccinationCard $card): array
    {
        $shots = $card->shots->map(fn($shot) => $shot->toApiArray());
        
        return [
            'card_id' => $card->card_id,
            'pet_id' => $card->pet_id,
            'vaccine_type' => $card->vaccine_type,
            'vaccine_name' => $card->vaccine_name,
            'is_required' => $card->is_required,
            'total_shots_required' => $card->total_shots_required,
            'interval_days' => $card->interval_days,
            'recurrence_type' => $card->recurrence_type,
            'status' => $card->status,
            'progress_percentage' => $card->progress_percentage,
            'completed_shots_count' => $card->completed_shots_count,
            'is_series_complete' => $card->isSeriesComplete(),
            'next_shot_date' => $card->calculateNextShotDate()?->format('Y-m-d'),
            'next_shot_date_display' => $card->calculateNextShotDate()?->format('M j, Y'),
            'shots' => $shots,
        ];
    }

    /**
     * Calculate overall vaccination status based on all cards
     */
    private function calculateOverallStatus($cards): string
    {
        if ($cards->isEmpty()) {
            return 'not_started';
        }

        $requiredCards = $cards->where('is_required', true);

        if ($requiredCards->where('status', 'overdue')->count() > 0) {
            return 'overdue';
        }

        if ($requiredCards->where('status', 'completed')->count() === $requiredCards->count()) {
            return 'completed';
        }

        if ($requiredCards->whereIn('status', ['in_progress', 'completed'])->count() > 0) {
            return 'in_progress';
        }

        return 'not_started';
    }
}
