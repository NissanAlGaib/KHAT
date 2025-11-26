<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\BreedingContract;
use App\Models\Pet;
use Carbon\Carbon;

class ShooterController extends Controller
{
    /**
     * Get all verified shooters
     */
    public function index(Request $request)
    {
        try {
            // Get the shooter role ID
            $shooterRole = Role::where('role_type', 'Shooter')->first();

            if (!$shooterRole) {
                return response()->json([
                    'success' => true,
                    'message' => 'No shooter role found',
                    'data' => []
                ]);
            }

            // Get users with shooter role who are verified
            $shooters = User::whereHas('roles', function ($query) use ($shooterRole) {
                $query->where('roles.role_id', $shooterRole->role_id);
            })
                ->whereHas('userAuth', function ($query) {
                    $query->where('auth_type', 'shooter_certificate')
                        ->where('status', 'approved');
                })
                ->with(['roles', 'pets'])
                ->get();

            $shooterProfiles = $shooters->map(function ($user) {
                // Calculate experience (assuming user created_at as start date)
                $experienceYears = $user->created_at ? ceil($user->created_at->diffInYears(now())) : 0;

                // Check if user is also a pet owner
                $isPetOwner = $user->roles->contains(function ($role) {
                    return $role->role_type === 'Breeder';
                });

                // Get pet breed if user is a pet owner
                $petBreed = null;
                if ($isPetOwner && $user->pets->isNotEmpty()) {
                    $petBreed = $user->pets->first()->breed;
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'profile_image' => $user->profile_image,
                    'sex' => $user->sex,
                    'birthdate' => $user->birthdate,
                    'age' => $user->birthdate ? ceil(Carbon::parse($user->birthdate)->diffInYears(now())) : null,
                    'experience_years' => $experienceYears,
                    'specialization' => null, // TODO: Add specialization field to users table
                    'is_pet_owner' => $isPetOwner,
                    'pet_breed' => $petBreed,
                    'rating' => null, // TODO: Implement rating system
                    'completed_sessions' => null, // TODO: Implement session tracking
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $shooterProfiles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get shooters',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available shooter offers (contracts with pending shooter status)
     */
    public function getOffers(Request $request)
    {
        try {
            $user = $request->user();

            // Verify user is a shooter
            $shooterRole = Role::where('role_type', 'Shooter')->first();
            if (!$shooterRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shooter role not found'
                ], 404);
            }

            $isShooter = $user->roles()->where('roles.role_id', $shooterRole->role_id)->exists();
            if (!$isShooter) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not a registered shooter'
                ], 403);
            }

            // Get all accepted contracts with pending shooter status
            $offers = BreedingContract::where('status', 'accepted')
                ->where('shooter_status', 'pending')
                ->whereNotNull('shooter_payment')
                ->where('shooter_payment', '>', 0)
                ->with([
                    'conversation.matchRequest.requesterPet.user',
                    'conversation.matchRequest.requesterPet.photos',
                    'conversation.matchRequest.targetPet.user',
                    'conversation.matchRequest.targetPet.photos',
                ])
                ->get();

            // Detailed debug logging
            $allAccepted = BreedingContract::where('status', 'accepted')->get();
            \Log::info('Shooter offers query results', [
                'count' => $offers->count(),
                'user_id' => $user->id,
                'total_accepted_contracts' => $allAccepted->count(),
                'contracts_with_shooter_payment' => $allAccepted->filter(fn($c) => $c->shooter_payment && (float) $c->shooter_payment > 0)->count(),
                'contracts_with_pending_shooter' => $allAccepted->where('shooter_status', 'pending')->count(),
                'all_accepted_details' => $allAccepted->map(fn($c) => [
                    'id' => $c->id,
                    'status' => $c->status,
                    'shooter_status' => $c->shooter_status,
                    'shooter_payment' => $c->shooter_payment,
                    'shooter_payment_float' => (float) $c->shooter_payment,
                ])->toArray(),
            ]);

            $formattedOffers = $offers->filter(function ($contract) {
                // Filter out contracts with missing relationships
                return $contract->conversation 
                    && $contract->conversation->matchRequest 
                    && $contract->conversation->matchRequest->requesterPet 
                    && $contract->conversation->matchRequest->targetPet
                    && $contract->conversation->matchRequest->requesterPet->user
                    && $contract->conversation->matchRequest->targetPet->user;
            })->map(function ($contract) {
                $matchRequest = $contract->conversation->matchRequest;
                $pet1 = $matchRequest->requesterPet;
                $pet2 = $matchRequest->targetPet;
                $owner1 = $pet1->user;
                $owner2 = $pet2->user;

                $pet1Photo = $pet1->photos->where('is_primary', true)->first();
                $pet2Photo = $pet2->photos->where('is_primary', true)->first();

                return [
                    'id' => $contract->id,
                    'conversation_id' => $contract->conversation_id,
                    'pet1' => [
                        'pet_id' => $pet1->pet_id,
                        'name' => $pet1->name,
                        'breed' => $pet1->breed,
                        'species' => $pet1->species,
                        'photo_url' => $pet1Photo?->photo_url,
                    ],
                    'pet2' => [
                        'pet_id' => $pet2->pet_id,
                        'name' => $pet2->name,
                        'breed' => $pet2->breed,
                        'species' => $pet2->species,
                        'photo_url' => $pet2Photo?->photo_url,
                    ],
                    'owner1' => [
                        'id' => $owner1->id,
                        'name' => $owner1->name,
                        'profile_image' => $owner1->profile_image,
                    ],
                    'owner2' => [
                        'id' => $owner2->id,
                        'name' => $owner2->name,
                        'profile_image' => $owner2->profile_image,
                    ],
                    'payment' => $contract->shooter_payment,
                    'location' => $contract->shooter_location,
                    'conditions' => $contract->shooter_conditions,
                    'shooter_name' => $contract->shooter_name,
                    'created_at' => $contract->created_at->toISOString(),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $formattedOffers
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get shooter offers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get shooter offers'
            ], 500);
        }
    }

    /**
     * Get details of a specific shooter offer
     */
    public function getOfferDetails(Request $request, $contractId)
    {
        try {
            $user = $request->user();

            // Verify user is a shooter
            $shooterRole = Role::where('role_type', 'Shooter')->first();
            if (!$shooterRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shooter role not found'
                ], 404);
            }

            $isShooter = $user->roles()->where('roles.role_id', $shooterRole->role_id)->exists();
            if (!$isShooter) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not a registered shooter'
                ], 403);
            }

            // Get the contract
            $contract = BreedingContract::where('status', 'accepted')
                ->where('shooter_status', 'pending')
                ->whereNotNull('shooter_payment')
                ->where('shooter_payment', '>', 0)
                ->with([
                    'conversation.matchRequest.requesterPet.user',
                    'conversation.matchRequest.requesterPet.photos',
                    'conversation.matchRequest.targetPet.user',
                    'conversation.matchRequest.targetPet.photos',
                ])
                ->find($contractId);

            if (!$contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Offer not found or no longer available'
                ], 404);
            }

            $matchRequest = $contract->conversation->matchRequest;
            $pet1 = $matchRequest->requesterPet;
            $pet2 = $matchRequest->targetPet;
            $owner1 = $pet1->user;
            $owner2 = $pet2->user;

            $pet1Photo = $pet1->photos->where('is_primary', true)->first();
            $pet2Photo = $pet2->photos->where('is_primary', true)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $contract->id,
                    'conversation_id' => $contract->conversation_id,
                    'pet1' => [
                        'pet_id' => $pet1->pet_id,
                        'name' => $pet1->name,
                        'breed' => $pet1->breed,
                        'species' => $pet1->species,
                        'sex' => $pet1->sex,
                        'birthdate' => $pet1->birthdate,
                        'photo_url' => $pet1Photo?->photo_url,
                    ],
                    'pet2' => [
                        'pet_id' => $pet2->pet_id,
                        'name' => $pet2->name,
                        'breed' => $pet2->breed,
                        'species' => $pet2->species,
                        'sex' => $pet2->sex,
                        'birthdate' => $pet2->birthdate,
                        'photo_url' => $pet2Photo?->photo_url,
                    ],
                    'owner1' => [
                        'id' => $owner1->id,
                        'name' => $owner1->name,
                        'profile_image' => $owner1->profile_image,
                        'contact_number' => $owner1->contact_number,
                    ],
                    'owner2' => [
                        'id' => $owner2->id,
                        'name' => $owner2->name,
                        'profile_image' => $owner2->profile_image,
                        'contact_number' => $owner2->contact_number,
                    ],
                    'payment' => $contract->shooter_payment,
                    'location' => $contract->shooter_location,
                    'conditions' => $contract->shooter_conditions,
                    'shooter_name' => $contract->shooter_name,
                    'end_contract_date' => $contract->end_contract_date?->format('Y-m-d'),
                    'created_at' => $contract->created_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get shooter offer details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get offer details'
            ], 500);
        }
    }

    /**
     * Accept a shooter offer
     */
    public function acceptOffer(Request $request, $contractId)
    {
        try {
            $user = $request->user();

            // Verify user is a shooter
            $shooterRole = Role::where('role_type', 'Shooter')->first();
            if (!$shooterRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shooter role not found'
                ], 404);
            }

            $isShooter = $user->roles()->where('roles.role_id', $shooterRole->role_id)->exists();
            if (!$isShooter) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not a registered shooter'
                ], 403);
            }

            // Get the contract
            $contract = BreedingContract::where('status', 'accepted')
                ->where('shooter_status', 'pending')
                ->whereNotNull('shooter_payment')
                ->where('shooter_payment', '>', 0)
                ->find($contractId);

            if (!$contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Offer not found or no longer available'
                ], 404);
            }

            // Update contract with shooter's acceptance
            $contract->update([
                'shooter_user_id' => $user->id,
                'shooter_status' => 'accepted_by_shooter',
                'shooter_accepted_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Offer accepted. Waiting for owners to confirm.',
                'data' => [
                    'id' => $contract->id,
                    'shooter_status' => $contract->shooter_status,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to accept shooter offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept offer'
            ], 500);
        }
    }

    /**
     * Get shooter's accepted offers (pending owner confirmation)
     */
    public function getMyOffers(Request $request)
    {
        try {
            $user = $request->user();

            // Verify user is a shooter
            $shooterRole = Role::where('role_type', 'Shooter')->first();
            if (!$shooterRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shooter role not found'
                ], 404);
            }

            $isShooter = $user->roles()->where('roles.role_id', $shooterRole->role_id)->exists();
            if (!$isShooter) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not a registered shooter'
                ], 403);
            }

            // Get all contracts where this shooter has accepted
            $offers = BreedingContract::where('shooter_user_id', $user->id)
                ->whereIn('shooter_status', ['accepted_by_shooter', 'accepted_by_owners'])
                ->with([
                    'conversation.matchRequest.requesterPet.user',
                    'conversation.matchRequest.requesterPet.photos',
                    'conversation.matchRequest.targetPet.user',
                    'conversation.matchRequest.targetPet.photos',
                ])
                ->get();

            $formattedOffers = $offers->map(function ($contract) {
                $matchRequest = $contract->conversation->matchRequest;
                $pet1 = $matchRequest->requesterPet;
                $pet2 = $matchRequest->targetPet;
                $owner1 = $pet1->user;
                $owner2 = $pet2->user;

                $pet1Photo = $pet1->photos->where('is_primary', true)->first();
                $pet2Photo = $pet2->photos->where('is_primary', true)->first();

                return [
                    'id' => $contract->id,
                    'conversation_id' => $contract->conversation_id,
                    'pet1' => [
                        'pet_id' => $pet1->pet_id,
                        'name' => $pet1->name,
                        'breed' => $pet1->breed,
                        'species' => $pet1->species,
                        'photo_url' => $pet1Photo?->photo_url,
                    ],
                    'pet2' => [
                        'pet_id' => $pet2->pet_id,
                        'name' => $pet2->name,
                        'breed' => $pet2->breed,
                        'species' => $pet2->species,
                        'photo_url' => $pet2Photo?->photo_url,
                    ],
                    'owner1' => [
                        'id' => $owner1->id,
                        'name' => $owner1->name,
                        'profile_image' => $owner1->profile_image,
                    ],
                    'owner2' => [
                        'id' => $owner2->id,
                        'name' => $owner2->name,
                        'profile_image' => $owner2->profile_image,
                    ],
                    'payment' => $contract->shooter_payment,
                    'location' => $contract->shooter_location,
                    'shooter_status' => $contract->shooter_status,
                    'owner1_accepted' => $contract->owner1_accepted_shooter,
                    'owner2_accepted' => $contract->owner2_accepted_shooter,
                    'created_at' => $contract->created_at->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedOffers
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get shooter my offers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get your offers'
            ], 500);
        }
    }

    /**
     * Get a specific shooter's profile
     */
    public function show(Request $request, $id)
    {
        try {
            $shooter = User::with(['roles', 'pets.photos', 'pets.partnerPreferences', 'userAuth'])->find($id);

            if (!$shooter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shooter not found'
                ], 404);
            }

            // Check if user has shooter role
            $hasShooterRole = $shooter->roles->contains(function ($role) {
                return $role->role_type === 'Shooter';
            });

            if (!$hasShooterRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a shooter'
                ], 404);
            }

            $experienceYears = $shooter->created_at ? ceil($shooter->created_at->diffInYears(now())) : 0;

            $isPetOwner = $shooter->roles->contains(function ($role) {
                return $role->role_type === 'Breeder';
            });

            // Collect unique breeds handled (from preferences or pets owned)
            $breedsHandled = collect();

            // Get breeds from owned pets
            if ($isPetOwner && $shooter->pets->isNotEmpty()) {
                $shooter->pets->each(function ($pet) use ($breedsHandled) {
                    $breedsHandled->push($pet->breed);
                });
            }

            // Get formatted pets data if user is a breeder
            $petsData = [];
            if ($isPetOwner && $shooter->pets->isNotEmpty()) {
                $petsData = $shooter->pets->map(function ($pet) {
                    $primaryPhoto = $pet->photos->where('is_primary', true)->first();

                    // Determine status based on breeding activity
                    $status = 'Available';
                    if ($pet->has_been_bred && $pet->breeding_count > 0) {
                        $status = 'Breeding';
                    }

                    return [
                        'pet_id' => $pet->pet_id,
                        'name' => $pet->name,
                        'breed' => $pet->breed,
                        'species' => $pet->species,
                        'sex' => $pet->sex,
                        'profile_image' => $primaryPhoto ? $primaryPhoto->photo_url : $pet->profile_image,
                        'status' => $status,
                        'has_been_bred' => $pet->has_been_bred,
                        'breeding_count' => $pet->breeding_count,
                    ];
                })->values()->toArray();
            }

            // Calculate statistics
            $totalPets = $shooter->pets->count();
            $dogCount = $shooter->pets->where('species', 'Dog')->count();
            $catCount = $shooter->pets->where('species', 'Cat')->count();

            // Count pets that have been matched/bred
            $matchedCount = $shooter->pets->where('has_been_bred', true)->count();

            // Check verification statuses
            $idVerified = $shooter->userAuth->where('auth_type', 'id')
                ->where('status', 'approved')
                ->isNotEmpty();

            $breederVerified = $shooter->userAuth->where('auth_type', 'breeder_certificate')
                ->where('status', 'approved')
                ->isNotEmpty();

            $shooterVerified = $shooter->userAuth->where('auth_type', 'shooter_certificate')
                ->where('status', 'approved')
                ->isNotEmpty();

            $shooterProfile = [
                'id' => $shooter->id,
                'name' => $shooter->name,
                'email' => $shooter->email,
                'profile_image' => $shooter->profile_image,
                'sex' => $shooter->sex,
                'birthdate' => $shooter->birthdate,
                'age' => $shooter->birthdate ? ceil(Carbon::parse($shooter->birthdate)->diffInYears(now())) : null,
                'contact_number' => $shooter->contact_number,
                'address' => $shooter->address,
                'experience_years' => $experienceYears,
                'specialization' => null,
                'is_pet_owner' => $isPetOwner,
                'breeds_handled' => $breedsHandled->unique()->values()->toArray(),
                'pets' => $petsData,
                'rating' => null, // TODO: Implement rating system
                'completed_sessions' => null, // TODO: Implement session tracking
                'breeders_handled' => 0, // TODO: Implement breeder tracking
                'successful_shoots' => 0, // TODO: Implement shoot tracking
                'verification_status' => $shooter->userAuth->where('auth_type', 'shooter_certificate')->first()?->status ?? 'pending',
                'id_verified' => $idVerified,
                'breeder_verified' => $breederVerified,
                'shooter_verified' => $shooterVerified,
                'statistics' => [
                    'total_pets' => $totalPets,
                    'matched' => $matchedCount,
                    'dog_count' => $dogCount,
                    'cat_count' => $catCount,
                    'breeders_handled' => 0, // TODO: Implement
                    'successful_shoots' => 0, // TODO: Implement
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $shooterProfile
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get shooter profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Debug endpoint to check contract states
     */
    public function debugContracts(Request $request)
    {
        try {
            $allContracts = BreedingContract::with(['conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet'])
                ->get();

            $data = $allContracts->map(function ($contract) {
                return [
                    'id' => $contract->id,
                    'conversation_id' => $contract->conversation_id,
                    'status' => $contract->status,
                    'shooter_status' => $contract->shooter_status,
                    'shooter_payment' => $contract->shooter_payment,
                    'shooter_payment_is_null' => is_null($contract->shooter_payment),
                    'shooter_payment_float' => (float) $contract->shooter_payment,
                    'has_conversation' => $contract->conversation !== null,
                    'has_match_request' => $contract->conversation?->matchRequest !== null,
                    'has_requester_pet' => $contract->conversation?->matchRequest?->requesterPet !== null,
                    'has_target_pet' => $contract->conversation?->matchRequest?->targetPet !== null,
                    'created_at' => $contract->created_at?->toISOString(),
                    'accepted_at' => $contract->accepted_at?->toISOString(),
                ];
            });

            $summary = [
                'total_contracts' => $allContracts->count(),
                'accepted_contracts' => $allContracts->where('status', 'accepted')->count(),
                'with_shooter_payment' => $allContracts->filter(fn($c) => (float) $c->shooter_payment > 0)->count(),
                'pending_shooter_status' => $allContracts->where('shooter_status', 'pending')->count(),
                'eligible_for_shooter' => $allContracts->filter(fn($c) => 
                    $c->status === 'accepted' && 
                    $c->shooter_status === 'pending' && 
                    (float) $c->shooter_payment > 0
                )->count(),
            ];

            return response()->json([
                'success' => true,
                'summary' => $summary,
                'contracts' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Debug failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manually fix shooter status for existing contracts
     */
    public function fixShooterStatus(Request $request)
    {
        try {
            // Get contracts that should have pending shooter status
            $contracts = BreedingContract::where('status', 'accepted')
                ->whereNotNull('shooter_payment')
                ->where('shooter_payment', '>', 0)
                ->where(function ($query) {
                    $query->where('shooter_status', 'none')
                          ->orWhereNull('shooter_status');
                })
                ->get();

            $fixedIds = [];
            foreach ($contracts as $contract) {
                $contract->update(['shooter_status' => 'pending']);
                $fixedIds[] = $contract->id;
            }

            return response()->json([
                'success' => true,
                'message' => 'Fixed ' . count($fixedIds) . ' contracts',
                'fixed_contract_ids' => $fixedIds,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fix failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
