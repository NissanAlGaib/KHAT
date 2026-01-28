<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\User;
use App\Models\Role;
use Carbon\Carbon;

class SearchController extends Controller
{
    /**
     * Search for pets by name, breed, species, or sex
     */
    public function searchPets(Request $request)
    {
        try {
            $query = $request->input('q', '');
            $species = $request->input('species');
            $sex = $request->input('sex');

            $petsQuery = Pet::where('status', 'approved')
                ->where(function ($q) {
                    // Exclude pets on cooldown
                    $q->whereNull('cooldown_until')
                      ->orWhere('cooldown_until', '<=', now());
                })
                ->with(['owner:id,name,profile_image', 'photos']);

            // Apply text search if query provided
            if (!empty($query)) {
                $petsQuery->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('breed', 'like', "%{$query}%")
                      ->orWhere('species', 'like', "%{$query}%");
                });
            }

            // Apply species filter
            if (!empty($species)) {
                $petsQuery->where('species', $species);
            }

            // Apply sex filter
            if (!empty($sex)) {
                $petsQuery->where('sex', $sex);
            }

            $pets = $petsQuery->limit(50)->get();

            $formattedPets = $pets->map(function ($pet) {
                $primaryPhoto = $pet->photos->where('is_primary', true)->first();

                return [
                    'pet_id' => $pet->pet_id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'breed' => $pet->breed,
                    'sex' => $pet->sex,
                    'birthdate' => $pet->birthdate,
                    'age' => $pet->age,
                    'behaviors' => $pet->behaviors,
                    'attributes' => $pet->getAttribute('attributes'),
                    'profile_image' => $primaryPhoto ? $primaryPhoto->photo_url : $pet->profile_image,
                    'photos' => $pet->photos->map(function ($photo) {
                        return [
                            'photo_url' => $photo->photo_url,
                            'is_primary' => $photo->is_primary,
                        ];
                    }),
                    'owner' => $pet->owner ? [
                        'id' => $pet->owner->id,
                        'name' => $pet->owner->name,
                        'profile_image' => $pet->owner->profile_image,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search pets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for breeders (users with Breeder role)
     */
    public function searchBreeders(Request $request)
    {
        try {
            $query = $request->input('q', '');

            // Get the breeder role
            $breederRole = Role::where('role_type', 'Breeder')->first();

            if (!$breederRole) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $breedersQuery = User::whereHas('roles', function ($q) use ($breederRole) {
                $q->where('roles.role_id', $breederRole->role_id);
            })
            ->whereHas('userAuth', function ($q) {
                $q->where('auth_type', 'id')
                  ->where('status', 'approved');
            })
            ->with(['pets.photos', 'roles']);

            // Apply text search if query provided
            if (!empty($query)) {
                $breedersQuery->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%")
                      ->orWhereHas('pets', function ($petQuery) use ($query) {
                          $petQuery->where('breed', 'like', "%{$query}%");
                      });
                });
            }

            $breeders = $breedersQuery->limit(50)->get();

            $formattedBreeders = $breeders->map(function ($user) {
                $experienceYears = $user->created_at ? ceil($user->created_at->diffInYears(now())) : 0;
                
                // Get pet breeds
                $petBreeds = $user->pets->pluck('breed')->unique()->filter()->values()->toArray();
                
                // Get pet count
                $petCount = $user->pets->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile_image' => $user->profile_image,
                    'sex' => $user->sex,
                    'birthdate' => $user->birthdate,
                    'age' => $user->birthdate ? ceil(Carbon::parse($user->birthdate)->diffInYears(now())) : null,
                    'experience_years' => $experienceYears,
                    'pet_breeds' => $petBreeds,
                    'pet_count' => $petCount,
                    'address' => $user->address,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedBreeders
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search breeders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for shooters (users with Shooter role)
     */
    public function searchShooters(Request $request)
    {
        try {
            $query = $request->input('q', '');

            // Get the shooter role
            $shooterRole = Role::where('role_type', 'Shooter')->first();

            if (!$shooterRole) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $shootersQuery = User::whereHas('roles', function ($q) use ($shooterRole) {
                $q->where('roles.role_id', $shooterRole->role_id);
            })
            ->whereHas('userAuth', function ($q) {
                $q->where('auth_type', 'shooter_certificate')
                  ->where('status', 'approved');
            })
            ->with(['pets', 'roles']);

            // Apply text search if query provided
            if (!empty($query)) {
                $shootersQuery->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%");
                });
            }

            $shooters = $shootersQuery->limit(50)->get();

            $formattedShooters = $shooters->map(function ($user) {
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
                    'specialization' => null,
                    'is_pet_owner' => $isPetOwner,
                    'pet_breed' => $petBreed,
                    'rating' => null,
                    'completed_sessions' => null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedShooters
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search shooters',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
