<?php

namespace App\Http\Controllers;

use App\Models\Litter;
use App\Models\LitterOffspring;
use App\Models\Pet;
use App\Models\VaccinationCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class LitterController extends Controller
{
    /**
     * Get all litters for a specific pet
     */
    public function getPetLitters($petId)
    {
        $pet = Pet::findOrFail($petId);

        // Get litters based on pet's sex
        $litters = Litter::where(function ($query) use ($petId, $pet) {
            if ($pet->sex === 'male') {
                $query->where('sire_id', $petId);
            } else {
                $query->where('dam_id', $petId);
            }
        })
            ->with([
                'sire:pet_id,name,profile_image',
                'dam:pet_id,name,profile_image',
                'sireOwner:id,name,profile_image',
                'damOwner:id,name,profile_image',
                'offspring'
            ])
            ->orderBy('birth_date', 'desc')
            ->get();

        $formattedLitters = $litters->map(function ($litter) {
            return [
                'litter_id' => $litter->litter_id,
                'title' => $litter->sire->name . ' & ' . $litter->dam->name,
                'birth_date' => $litter->birth_date->format('M Y'),
                'birth_date_full' => $litter->birth_date->format('Y-m-d'),
                'status' => $litter->status,
                'offspring' => [
                    'total' => $litter->total_offspring,
                    'alive' => $litter->alive_offspring,
                    'died' => $litter->died_offspring,
                    'male' => $litter->male_count,
                    'female' => $litter->female_count,
                ],
                'parents' => [
                    'sire' => [
                        'pet_id' => $litter->sire->pet_id,
                        'name' => $litter->sire->name,
                        'photo' => $litter->sire->profile_image,
                        'owner' => [
                            'id' => $litter->sireOwner->id,
                            'name' => $litter->sireOwner->name,
                            'profile_image' => $litter->sireOwner->profile_image,
                        ],
                    ],
                    'dam' => [
                        'pet_id' => $litter->dam->pet_id,
                        'name' => $litter->dam->name,
                        'photo' => $litter->dam->profile_image,
                        'owner' => [
                            'id' => $litter->damOwner->id,
                            'name' => $litter->damOwner->name,
                            'profile_image' => $litter->damOwner->profile_image,
                        ],
                    ],
                ],
                'offspring_details' => $litter->offspring->map(function ($offspring) {
                    return [
                        'offspring_id' => $offspring->offspring_id,
                        'name' => $offspring->name,
                        'sex' => $offspring->sex,
                        'color' => $offspring->color,
                        'photo_url' => $offspring->photo_url,
                        'status' => $offspring->status,
                    ];
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedLitters,
        ]);
    }

    /**
     * Get detailed information about a specific litter
     */
    public function show($litterId)
    {
        $litter = Litter::with([
            'sire:pet_id,name,breed,species,profile_image,user_id',
            'dam:pet_id,name,breed,species,profile_image,user_id',
            'sireOwner:id,name,profile_image',
            'damOwner:id,name,profile_image',
            'offspring.assignedTo:id,name,profile_image',
            'contract'
        ])->findOrFail($litterId);

        // Build health lineage for both parents
        $sireHealth = $this->getParentHealthSummary($litter->sire_id);
        $damHealth = $this->getParentHealthSummary($litter->dam_id);

        // Build milestones timeline
        $milestones = $this->buildMilestones($litter);

        $formattedLitter = [
            'litter_id' => $litter->litter_id,
            'title' => $litter->sire->name . ' & ' . $litter->dam->name,
            'birth_date' => $litter->birth_date->format('M d, Y'),
            'birth_date_full' => $litter->birth_date->format('Y-m-d'),
            'age_in_months' => $litter->birth_date->diffInMonths(now()),
            'age_in_weeks' => $litter->birth_date->diffInWeeks(now()),
            'status' => $litter->status,
            'notes' => $litter->notes,
            'has_contract' => !is_null($litter->contract_id),
            'statistics' => [
                'total_offspring' => $litter->total_offspring,
                'alive_offspring' => $litter->alive_offspring,
                'died_offspring' => $litter->died_offspring,
                'male_count' => $litter->male_count,
                'female_count' => $litter->female_count,
                'assigned_count' => $litter->offspring->where('allocation_status', 'assigned')->count(),
                'transferred_count' => $litter->offspring->where('allocation_status', 'transferred')->count(),
                'unassigned_count' => $litter->offspring->where('allocation_status', 'unassigned')->count(),
            ],
            'milestones' => $milestones,
            'parents' => [
                'sire' => [
                    'pet_id' => $litter->sire->pet_id,
                    'name' => $litter->sire->name,
                    'breed' => $litter->sire->breed,
                    'species' => $litter->sire->species,
                    'photo' => $litter->sire->profile_image,
                    'owner' => [
                        'id' => $litter->sireOwner->id,
                        'name' => $litter->sireOwner->name,
                        'profile_image' => $litter->sireOwner->profile_image,
                    ],
                    'health' => $sireHealth,
                ],
                'dam' => [
                    'pet_id' => $litter->dam->pet_id,
                    'name' => $litter->dam->name,
                    'breed' => $litter->dam->breed,
                    'species' => $litter->dam->species,
                    'photo' => $litter->dam->profile_image,
                    'owner' => [
                        'id' => $litter->damOwner->id,
                        'name' => $litter->damOwner->name,
                        'profile_image' => $litter->damOwner->profile_image,
                    ],
                    'health' => $damHealth,
                ],
            ],
            'offspring' => $litter->offspring->map(function ($offspring) {
                return [
                    'offspring_id' => $offspring->offspring_id,
                    'name' => $offspring->name,
                    'sex' => $offspring->sex,
                    'color' => $offspring->color,
                    'photo_url' => $offspring->photo_url,
                    'status' => $offspring->status,
                    'death_date' => $offspring->death_date?->format('M d, Y'),
                    'notes' => $offspring->notes,
                    'is_registered' => !is_null($offspring->pet_id),
                    'allocation_status' => $offspring->allocation_status ?? 'unassigned',
                    'selection_order' => $offspring->selection_order,
                    'assigned_to' => $offspring->assignedTo ? [
                        'id' => $offspring->assignedTo->id,
                        'name' => $offspring->assignedTo->name,
                        'profile_image' => $offspring->assignedTo->profile_image,
                    ] : null,
                ];
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => $formattedLitter,
        ]);
    }

    /**
     * Get health summary for a parent pet (vaccination status)
     */
    private function getParentHealthSummary($petId): array
    {
        $cards = VaccinationCard::where('pet_id', $petId)
            ->with(['shots' => function ($query) {
                $query->orderBy('shot_number', 'asc');
            }])
            ->get();

        $vaccinations = $cards->map(function ($card) {
            $completedShots = $card->shots->where('status', 'administered')->count();
            $totalShots = $card->total_shots_required;

            return [
                'vaccine_name' => $card->vaccine_name,
                'is_required' => $card->is_required,
                'status' => $card->status,
                'completed_shots' => $completedShots,
                'total_shots' => $totalShots,
                'is_complete' => $completedShots >= $totalShots,
            ];
        });

        $totalRequired = $vaccinations->where('is_required', true)->count();
        $completedRequired = $vaccinations->where('is_required', true)->where('is_complete', true)->count();

        return [
            'vaccinations' => $vaccinations->toArray(),
            'total_vaccines' => $vaccinations->count(),
            'completed_vaccines' => $vaccinations->where('is_complete', true)->count(),
            'required_vaccines' => $totalRequired,
            'completed_required' => $completedRequired,
            'health_score' => $totalRequired > 0
                ? round(($completedRequired / $totalRequired) * 100)
                : 100,
        ];
    }

    /**
     * Build milestone timeline for a litter
     */
    private function buildMilestones(Litter $litter): array
    {
        $milestones = [];
        $birthDate = $litter->birth_date;
        $now = now();

        // Born milestone (always present)
        $milestones[] = [
            'key' => 'born',
            'label' => 'Born',
            'date' => $birthDate->format('M d, Y'),
            'description' => "{$litter->total_offspring} puppies/kittens born",
            'completed' => true,
        ];

        // Weaning milestone (~6-8 weeks after birth)
        $weaningDate = $birthDate->copy()->addWeeks(7);
        $milestones[] = [
            'key' => 'weaned',
            'label' => 'Weaned',
            'date' => $weaningDate->format('M d, Y'),
            'description' => 'Transition to solid food complete',
            'completed' => $now->gte($weaningDate),
        ];

        // First vaccination (~6-8 weeks)
        $firstVaxDate = $birthDate->copy()->addWeeks(8);
        $milestones[] = [
            'key' => 'first_vaccination',
            'label' => 'First Vaccination',
            'date' => $firstVaxDate->format('M d, Y'),
            'description' => 'Initial vaccination series',
            'completed' => $now->gte($firstVaxDate),
        ];

        // Ready for new homes (~8-12 weeks)
        $readyDate = $birthDate->copy()->addWeeks(10);
        $milestones[] = [
            'key' => 'available',
            'label' => 'Ready for New Homes',
            'date' => $readyDate->format('M d, Y'),
            'description' => 'Old enough for adoption/transfer',
            'completed' => $now->gte($readyDate),
        ];

        // Allocation milestone (if any offspring are assigned)
        $assignedCount = $litter->offspring->where('allocation_status', 'assigned')->count();
        $transferredCount = $litter->offspring->where('allocation_status', 'transferred')->count();
        if ($assignedCount > 0 || $transferredCount > 0) {
            $milestones[] = [
                'key' => 'allocated',
                'label' => 'Offspring Allocated',
                'date' => null,
                'description' => "{$assignedCount} assigned, {$transferredCount} transferred",
                'completed' => true,
            ];
        }

        return $milestones;
    }

    /**
     * Create a new litter
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sire_id' => 'required|exists:pets,pet_id',
            'dam_id' => 'required|exists:pets,pet_id',
            'birth_date' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string',
            'offspring' => 'required|array|min:1',
            'offspring.*.name' => 'nullable|string|max:255',
            'offspring.*.sex' => 'required|in:male,female',
            'offspring.*.color' => 'nullable|string|max:255',
            'offspring.*.photo' => 'nullable|image|mimes:jpg,jpeg,png|max:10240',
            'offspring.*.status' => 'required|in:alive,died,adopted',
            'offspring.*.death_date' => 'required_if:offspring.*.status,died|nullable|date',
            'offspring.*.notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Get parent pets and their owners
            $sire = Pet::findOrFail($validated['sire_id']);
            $dam = Pet::findOrFail($validated['dam_id']);

            // Validate sex of parents
            if ($sire->sex !== 'male') {
                return response()->json([
                    'message' => 'Sire must be a male pet',
                ], 422);
            }

            if ($dam->sex !== 'female') {
                return response()->json([
                    'message' => 'Dam must be a female pet',
                ], 422);
            }

            // Count offspring by sex and status
            $totalOffspring = count($validated['offspring']);
            $maleCount = 0;
            $femaleCount = 0;
            $aliveCount = 0;
            $diedCount = 0;

            foreach ($validated['offspring'] as $offspring) {
                if ($offspring['sex'] === 'male') {
                    $maleCount++;
                } else {
                    $femaleCount++;
                }

                if ($offspring['status'] === 'alive' || $offspring['status'] === 'adopted') {
                    $aliveCount++;
                } elseif ($offspring['status'] === 'died') {
                    $diedCount++;
                }
            }

            // Create the litter
            $litter = Litter::create([
                'sire_id' => $validated['sire_id'],
                'dam_id' => $validated['dam_id'],
                'sire_owner_id' => $sire->user_id,
                'dam_owner_id' => $dam->user_id,
                'birth_date' => $validated['birth_date'],
                'total_offspring' => $totalOffspring,
                'alive_offspring' => $aliveCount,
                'died_offspring' => $diedCount,
                'male_count' => $maleCount,
                'female_count' => $femaleCount,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create offspring records
            foreach ($validated['offspring'] as $offspringData) {
                $photoPath = null;
                if (isset($offspringData['photo'])) {
                    $photoPath = $offspringData['photo']->store('litter_offspring', 'public');
                }

                LitterOffspring::create([
                    'litter_id' => $litter->litter_id,
                    'name' => $offspringData['name'] ?? null,
                    'sex' => $offspringData['sex'],
                    'color' => $offspringData['color'] ?? null,
                    'photo_url' => $photoPath,
                    'status' => $offspringData['status'],
                    'death_date' => $offspringData['death_date'] ?? null,
                    'notes' => $offspringData['notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Litter created successfully',
                'data' => $litter->load(['offspring', 'sire', 'dam']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create litter',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
