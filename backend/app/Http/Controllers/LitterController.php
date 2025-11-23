<?php

namespace App\Http\Controllers;

use App\Models\Litter;
use App\Models\LitterOffspring;
use App\Models\Pet;
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
            'sire:pet_id,name,breed,profile_image',
            'dam:pet_id,name,breed,profile_image',
            'sireOwner:id,name,profile_image',
            'damOwner:id,name,profile_image',
            'offspring'
        ])->findOrFail($litterId);

        $formattedLitter = [
            'litter_id' => $litter->litter_id,
            'title' => $litter->sire->name . ' & ' . $litter->dam->name,
            'birth_date' => $litter->birth_date->format('M d, Y'),
            'age_in_months' => $litter->birth_date->diffInMonths(now()),
            'status' => $litter->status,
            'notes' => $litter->notes,
            'statistics' => [
                'total_offspring' => $litter->total_offspring,
                'alive_offspring' => $litter->alive_offspring,
                'died_offspring' => $litter->died_offspring,
                'male_count' => $litter->male_count,
                'female_count' => $litter->female_count,
            ],
            'parents' => [
                'sire' => [
                    'pet_id' => $litter->sire->pet_id,
                    'name' => $litter->sire->name,
                    'breed' => $litter->sire->breed,
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
                    'breed' => $litter->dam->breed,
                    'photo' => $litter->dam->profile_image,
                    'owner' => [
                        'id' => $litter->damOwner->id,
                        'name' => $litter->damOwner->name,
                        'profile_image' => $litter->damOwner->profile_image,
                    ],
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
                ];
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => $formattedLitter,
        ]);
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
