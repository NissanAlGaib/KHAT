<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\VaccinationCard;
use App\Models\VaccinationShot;
use App\Models\VaccineProtocol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                'message' => 'Shot proof uploaded successfully. Pending admin approval.',
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
     * Get available vaccine protocols for a pet (enrolled + available for opt-in)
     */
    public function getAvailableProtocols($petId)
    {
        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Get protocols already linked to this pet
        $enrolledProtocolIds = VaccinationCard::where('pet_id', $petId)
            ->whereNotNull('vaccine_protocol_id')
            ->pluck('vaccine_protocol_id')
            ->toArray();

        // Get enrolled protocols
        $enrolledProtocols = VaccineProtocol::active()
            ->whereIn('id', $enrolledProtocolIds)
            ->ordered()
            ->get()
            ->map(fn($p) => $p->toApiArray());

        // Get available optional protocols (active, matching species, not yet enrolled)
        $availableProtocols = VaccineProtocol::active()
            ->optional()
            ->forSpecies($pet->species)
            ->whereNotIn('id', $enrolledProtocolIds)
            ->ordered()
            ->get()
            ->map(fn($p) => $p->toApiArray());

        return response()->json([
            'success' => true,
            'data' => [
                'enrolled' => $enrolledProtocols->values(),
                'available' => $availableProtocols->values(),
            ],
        ]);
    }

    /**
     * Opt in to an optional vaccine protocol
     */
    public function optInToProtocol($petId, $protocolId)
    {
        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $protocol = VaccineProtocol::where('id', $protocolId)
            ->active()
            ->firstOrFail();

        // Verify species match
        if (strtolower($protocol->species) !== 'all' && strtolower($protocol->species) !== strtolower($pet->species)) {
            return response()->json([
                'success' => false,
                'message' => 'This protocol is not available for this pet\'s species.',
            ], 400);
        }

        try {
            $card = VaccinationCard::createFromProtocol($petId, $protocol);

            $card->load(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }, 'protocol']);

            return response()->json([
                'success' => true,
                'message' => 'Vaccination protocol added successfully',
                'data' => $this->formatCardResponse($card),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add vaccination protocol',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Change the protocol for an existing vaccination card
     */
    public function changeProtocol(Request $request, $petId, $cardId)
    {
        $request->validate([
            'protocol_id' => 'required|integer|exists:vaccine_protocols,id',
        ]);

        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $card = VaccinationCard::where('card_id', $cardId)
            ->where('pet_id', $petId)
            ->firstOrFail();

        $newProtocol = VaccineProtocol::where('id', $request->protocol_id)
            ->active()
            ->firstOrFail();

        // Verify species match
        if (strtolower($newProtocol->species) !== 'all' && strtolower($newProtocol->species) !== strtolower($pet->species)) {
            return response()->json([
                'success' => false,
                'message' => 'This protocol is not available for this pet\'s species.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Update card with new protocol details
            $card->vaccine_protocol_id = $newProtocol->id;
            $card->vaccine_type = $newProtocol->slug;
            $card->vaccine_name = $newProtocol->name;
            $card->is_required = $newProtocol->is_required;
            $card->total_shots_required = $newProtocol->series_doses;
            $card->interval_days = $newProtocol->series_interval_days ?? $newProtocol->booster_interval_days;
            
            // Determine recurrence_type
            $recurrenceType = 'none';
            if ($newProtocol->isPurelyRecurring()) {
                $recurrenceType = $newProtocol->booster_interval_days >= 365 ? 'yearly' : 'biannual';
            }
            $card->recurrence_type = $recurrenceType;

            $card->save();
            
            // Recalculate status
            $card->updateStatus();

            DB::commit();

            $card->load(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }, 'protocol']);

            return response()->json([
                'success' => true,
                'message' => 'Vaccination protocol updated successfully',
                'data' => $this->formatCardResponse($card),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update vaccination protocol',
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
                    'completed_shots' => $card->approved_shots_count,
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
            'completed_shots_count' => $card->approved_shots_count,
            'approved_shots_count' => $card->approved_shots_count,
            'pending_shots_count' => $card->pending_shots_count,
            'is_series_complete' => $card->isSeriesComplete(),
            'is_in_booster_phase' => $card->isInBoosterPhase(),
            'protocol' => $card->protocol ? $card->protocol->toApiArray() : null,
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

    /**
     * Import historical vaccination shots
     * These are shots that were administered before the pet was added to the app
     */
    public function importHistory(Request $request, $petId)
    {
        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'card_id' => 'required|integer|exists:vaccination_cards,card_id',
            'shots' => 'required|array|min:1',
            'shots.*.shot_number' => 'required|integer|min:1',
            'shots.*.vaccination_record' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'shots.*.clinic_name' => 'required|string|max:255',
            'shots.*.veterinarian_name' => 'required|string|max:255',
            'shots.*.date_administered' => 'required|date|before_or_equal:today',
            'shots.*.expiration_date' => 'required|date|after:shots.*.date_administered',
        ], [
            'shots.required' => 'At least one shot record is required.',
            'shots.*.vaccination_record.required' => 'Proof document is required for each shot.',
            'shots.*.date_administered.before_or_equal' => 'Date administered cannot be in the future.',
        ]);

        $card = VaccinationCard::where('card_id', $validated['card_id'])
            ->where('pet_id', $petId)
            ->firstOrFail();

        try {
            DB::beginTransaction();

            $importedShots = [];

            foreach ($validated['shots'] as $index => $shotData) {
                // Check for duplicate shot number
                $existingShot = VaccinationShot::where('card_id', $card->card_id)
                    ->where('shot_number', $shotData['shot_number'])
                    ->first();

                if ($existingShot) {
                    throw new \Exception("Shot #{$shotData['shot_number']} already exists for this vaccine.");
                }

                // Store the document
                $documentPath = $request->file("shots.{$index}.vaccination_record")
                    ->store('vaccinations', 'do_spaces');

                // Create historical shot
                $shot = VaccinationShot::createHistoricalShot(
                    $card,
                    $documentPath,
                    $shotData['clinic_name'],
                    $shotData['veterinarian_name'],
                    $shotData['date_administered'],
                    $shotData['expiration_date'],
                    $shotData['shot_number']
                );

                $importedShots[] = $shot->toApiArray();
            }

            DB::commit();

            // Reload the card with shots
            $card->load(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }]);

            return response()->json([
                'success' => true,
                'message' => 'Imported ' . count($importedShots) . ' historical record(s) successfully',
                'data' => [
                    'imported_shots' => $importedShots,
                    'card' => $this->formatCardResponse($card),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Add a single historical shot to a vaccination card
     */
    public function addHistoricalShot(Request $request, $petId, $cardId)
    {
        $validated = $request->validate([
            'vaccination_record' => 'required|file|max:20480',
            'clinic_name' => 'required|string|max:255',
            'veterinarian_name' => 'required|string|max:255',
            'date_administered' => 'required|date|before_or_equal:today',
            'expiration_date' => 'required|date|after:date_administered',
            'shot_number' => 'required|integer|min:1',
        ], [
            'vaccination_record.required' => 'Proof document is required.',
            'vaccination_record.file' => 'Invalid file upload.',
            'vaccination_record.max' => 'File size must not exceed 20MB.',
            'date_administered.before_or_equal' => 'Date administered cannot be in the future.',
            'shot_number.required' => 'Shot number is required for historical records.',
        ]);

        $pet = Pet::where('pet_id', $petId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $card = VaccinationCard::where('card_id', $cardId)
            ->where('pet_id', $petId)
            ->firstOrFail();

        // Check for duplicate shot number
        $existingShot = VaccinationShot::where('card_id', $card->card_id)
            ->where('shot_number', $validated['shot_number'])
            ->first();

        if ($existingShot) {
            return response()->json([
                'success' => false,
                'message' => "Shot #{$validated['shot_number']} already exists for this vaccine.",
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Store the document
            $documentPath = $request->file('vaccination_record')->store('vaccinations', 'do_spaces');

            // Create the historical shot
            $shot = VaccinationShot::createHistoricalShot(
                $card,
                $documentPath,
                $validated['clinic_name'],
                $validated['veterinarian_name'],
                $validated['date_administered'],
                $validated['expiration_date'],
                $validated['shot_number']
            );

            DB::commit();

            // Reload the card with shots
            $card->load(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }]);

            return response()->json([
                'success' => true,
                'message' => 'Historical shot added successfully',
                'data' => [
                    'shot' => $shot->toApiArray(),
                    'card' => $this->formatCardResponse($card),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to add historical shot: ' . $e->getMessage(), [
                'pet_id' => $petId,
                'card_id' => $cardId,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add historical shot: ' . $e->getMessage(),
            ], 500);
        }
    }
}
