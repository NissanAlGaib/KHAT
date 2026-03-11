<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Pet;
use App\Models\User;
use App\Models\Role;
use App\Helpers\DistanceHelper;
use Carbon\Carbon;

class SearchController extends Controller
{
    /**
     * Get list of available breeds (preset + dynamic from DB)
     */
    public function getBreeds(Request $request)
    {
        try {
            $species = $request->input('species');

            // Preset breeds
            $presetDogBreeds = [
                'Aspin',
                'Labrador Retriever',
                'German Shepherd',
                'Golden Retriever',
                'Bulldog',
                'Poodle',
                'Beagle',
                'Rottweiler',
                'Doberman',
                'Shih Tzu',
                'Siberian Husky',
                'Chihuahua',
                'Pomeranian',
                'Yorkshire Terrier',
                'Dachshund',
                'Corgi',
                'Dalmatian',
                'Chow Chow',
                'Border Collie',
                'Pit Bull',
                'Maltese',
                'Cocker Spaniel',
                'Great Dane',
                'Saint Bernard',
                'Australian Shepherd',
                'French Bulldog',
                'Pug',
            ];

            $presetCatBreeds = [
                'Puspin',
                'Persian',
                'Siamese',
                'Maine Coon',
                'Ragdoll',
                'Bengal',
                'British Shorthair',
                'Abyssinian',
                'Sphynx',
                'Scottish Fold',
                'Russian Blue',
                'Norwegian Forest Cat',
                'Birman',
                'Burmese',
                'Munchkin',
                'Exotic Shorthair',
                'American Shorthair',
                'Tonkinese',
                'Himalayan',
            ];

            // Get dynamic breeds from DB
            $dbQuery = Pet::where('status', 'active')
                ->whereNotNull('breed')
                ->where('breed', '!=', '');

            if (!empty($species)) {
                $dbQuery->where('species', $species);
            }

            $dbBreeds = $dbQuery->distinct()->pluck('breed')->toArray();

            // Merge preset + DB breeds, deduplicate
            if (!empty($species) && strtolower($species) === 'cat') {
                $allBreeds = array_unique(array_merge($presetCatBreeds, $dbBreeds));
            } elseif (!empty($species) && strtolower($species) === 'dog') {
                $allBreeds = array_unique(array_merge($presetDogBreeds, $dbBreeds));
            } else {
                $allBreeds = array_unique(array_merge($presetDogBreeds, $presetCatBreeds, $dbBreeds));
            }

            sort($allBreeds);

            return response()->json([
                'success' => true,
                'data' => [
                    'breeds' => array_values($allBreeds),
                    'dog_breeds' => array_values(array_unique(array_merge(
                        $presetDogBreeds,
                        Pet::where('status', 'active')->where('species', 'dog')->whereNotNull('breed')->where('breed', '!=', '')->distinct()->pluck('breed')->toArray()
                    ))),
                    'cat_breeds' => array_values(array_unique(array_merge(
                        $presetCatBreeds,
                        Pet::where('status', 'active')->where('species', 'cat')->whereNotNull('breed')->where('breed', '!=', '')->distinct()->pluck('breed')->toArray()
                    ))),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get breeds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Explore endpoint - returns all approved pets with pagination (no query required)
     * Supports filters: species, sex, breed, age_range
     */
    public function explore(Request $request)
    {
        try {
            $species = $request->input('species');
            $sex = $request->input('sex');
            $breed = $request->input('breed');
            $ageRange = $request->input('age_range'); // '<1', '1-3', '3-5', '5+'
            $page = max(1, (int) $request->input('page', 1));
            $perPage = min(30, max(1, (int) $request->input('per_page', 20)));

            $petsQuery = Pet::where('status', 'active')
                ->with(['owner:id,name,profile_image', 'photos']);

            // Apply species filter
            if (!empty($species)) {
                $petsQuery->where('species', $species);
            }

            // Apply sex filter
            if (!empty($sex)) {
                $petsQuery->where('sex', $sex);
            }

            // Apply breed filter
            if (!empty($breed)) {
                $petsQuery->where('breed', 'like', "%{$breed}%");
            }

            // Apply age range filter based on birthdate
            if (!empty($ageRange)) {
                $this->applyAgeRangeFilter($petsQuery, $ageRange);
            }

            // Order by newest first, with non-cooldown pets prioritized
            $petsQuery->orderByRaw('CASE WHEN cooldown_until IS NULL OR cooldown_until <= NOW() THEN 0 ELSE 1 END ASC')
                ->orderBy('created_at', 'desc');

            $total = $petsQuery->count();
            $pets = $petsQuery->skip(($page - 1) * $perPage)->take($perPage)->get();

            $viewer = $request->user();
            /** @var \Illuminate\Support\Collection<int, Pet> $pets */
            $formattedPets = $pets->map(function (Pet $pet) use ($viewer) {
                return $this->formatPetForSearch($pet, $viewer);
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPets,
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load explore pets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for pets by name, breed, species, or sex
     * No longer excludes cooldown pets - they appear with cooldown info
     */
    public function searchPets(Request $request)
    {
        try {
            $query = $request->input('q', '');
            $species = $request->input('species');
            $sex = $request->input('sex');
            $breed = $request->input('breed');
            $ageRange = $request->input('age_range'); // '<1', '1-3', '3-5', '5+'
            $page = max(1, (int) $request->input('page', 1));
            $perPage = min(30, max(1, (int) $request->input('per_page', 20)));

            $petsQuery = Pet::where('status', 'active')
                ->with(['owner:id,name,profile_image', 'photos']);

            // Apply text search if query provided (search pet name, breed, species, AND owner name)
            if (!empty($query)) {
                $petsQuery->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('breed', 'like', "%{$query}%")
                        ->orWhere('species', 'like', "%{$query}%")
                        ->orWhereHas('owner', function ($ownerQuery) use ($query) {
                            $ownerQuery->where('name', 'like', "%{$query}%");
                        });
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

            // Apply breed filter
            if (!empty($breed)) {
                $petsQuery->where('breed', 'like', "%{$breed}%");
            }

            // Apply age range filter
            if (!empty($ageRange)) {
                $this->applyAgeRangeFilter($petsQuery, $ageRange);
            }

            // Prioritize non-cooldown pets
            $petsQuery->orderByRaw('CASE WHEN cooldown_until IS NULL OR cooldown_until <= NOW() THEN 0 ELSE 1 END ASC')
                ->orderBy('created_at', 'desc');

            $total = $petsQuery->count();
            $pets = $petsQuery->skip(($page - 1) * $perPage)->take($perPage)->get();

            $viewer = $request->user();
            /** @var \Illuminate\Support\Collection<int, Pet> $pets */
            $formattedPets = $pets->map(function (Pet $pet) use ($viewer) {
                return $this->formatPetForSearch($pet, $viewer);
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPets,
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                ]
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
                ->where('id', '!=', Auth::id())
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

            $viewer = $request->user();
            $formattedBreeders = $breeders->map(function ($user) use ($viewer) {
                $experienceYears = $user->created_at ? ceil($user->created_at->diffInYears(now())) : 0;

                // Get pet breeds
                $petBreeds = $user->pets->pluck('breed')->unique()->filter()->values()->toArray();

                // Get pet count
                $petCount = $user->pets->count();

                $result = [
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
                    'distance_km' => null,
                    'distance_label' => null,
                ];

                if ($viewer && $viewer->hasLocation() && $user->hasLocation()) {
                    $distance = DistanceHelper::haversine(
                        $viewer->latitude,
                        $viewer->longitude,
                        $user->latitude,
                        $user->longitude
                    );
                    $formatted = DistanceHelper::format(
                        $distance,
                        $viewer->location_precision ?? 'city',
                        $user->location_precision ?? 'city'
                    );
                    $result['distance_km'] = $formatted['distance_km'];
                    $result['distance_label'] = $formatted['distance_label'];
                }

                return $result;
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
     * Global search across all categories (pets, breeders, shooters)
     * Returns unified results with counts for each category
     * No longer excludes cooldown pets
     */
    public function searchGlobal(Request $request)
    {
        try {
            $query = $request->input('q', '');
            $limit = $request->input('limit', 5); // Limit per category for preview

            if (empty($query)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'pets' => ['count' => 0, 'items' => []],
                        'breeders' => ['count' => 0, 'items' => []],
                        'shooters' => ['count' => 0, 'items' => []],
                    ]
                ]);
            }

            // Search Pets - no longer excludes cooldown pets, also searches by owner name
            $petsQuery = Pet::where('status', 'active')
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('breed', 'like', "%{$query}%")
                        ->orWhere('species', 'like', "%{$query}%")
                        ->orWhereHas('owner', function ($ownerQuery) use ($query) {
                            $ownerQuery->where('name', 'like', "%{$query}%");
                        });
                })
                ->with(['owner:id,name,profile_image', 'photos']);

            $petsCount = $petsQuery->count();
            $pets = $petsQuery->orderByRaw('CASE WHEN cooldown_until IS NULL OR cooldown_until <= NOW() THEN 0 ELSE 1 END ASC')
                ->limit($limit)->get();

            $viewer = $request->user();

            /** @var \Illuminate\Support\Collection<int, Pet> $pets */
            $formattedPets = $pets->map(function (Pet $pet) use ($viewer) {
                $primaryPhoto = $pet->photos->where('is_primary', true)->first();
                $distanceKm = null;
                $distanceLabel = null;
                if ($viewer && $viewer->hasLocation() && $pet->owner && $pet->owner->hasLocation()) {
                    $dist = DistanceHelper::haversine($viewer->latitude, $viewer->longitude, $pet->owner->latitude, $pet->owner->longitude);
                    $formatted = DistanceHelper::format($dist, $viewer->location_precision ?? 'city', $pet->owner->location_precision ?? 'city');
                    $distanceKm = $formatted['distance_km'];
                    $distanceLabel = $formatted['distance_label'];
                }
                return [
                    'pet_id' => $pet->pet_id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'breed' => $pet->breed,
                    'sex' => $pet->sex,
                    'age' => $pet->age,
                    'profile_image' => $primaryPhoto ? $primaryPhoto->photo_url : $pet->profile_image,
                    'is_on_cooldown' => $pet->isOnCooldown(),
                    'cooldown_days_remaining' => $pet->cooldown_days_remaining,
                    'owner' => $pet->owner ? [
                        'id' => $pet->owner->id,
                        'name' => $pet->owner->name,
                    ] : null,
                    'distance_km' => $distanceKm,
                    'distance_label' => $distanceLabel,
                ];
            });

            // Search Breeders
            $breederRole = Role::where('role_type', 'Breeder')->first();
            $breedersCount = 0;
            $formattedBreeders = collect([]);

            if ($breederRole) {
                $breedersQuery = User::whereHas('roles', function ($q) use ($breederRole) {
                    $q->where('roles.role_id', $breederRole->role_id);
                })
                    ->whereHas('userAuth', function ($q) {
                        $q->where('auth_type', 'id')
                            ->where('status', 'approved');
                    })
                    ->where('id', '!=', Auth::id())
                    ->where(function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%")
                            ->orWhere('email', 'like', "%{$query}%")
                            ->orWhereHas('pets', function ($petQuery) use ($query) {
                                $petQuery->where('breed', 'like', "%{$query}%");
                            });
                    })
                    ->with(['pets.photos']);

                $breedersCount = $breedersQuery->count();
                $breeders = $breedersQuery->limit($limit)->get();

                $formattedBreeders = $breeders->map(function ($user) use ($viewer) {
                    $petBreeds = $user->pets->pluck('breed')->unique()->filter()->values()->toArray();
                    $distanceKm = null;
                    $distanceLabel = null;
                    if ($viewer && $viewer->hasLocation() && $user->hasLocation()) {
                        $dist = DistanceHelper::haversine($viewer->latitude, $viewer->longitude, $user->latitude, $user->longitude);
                        $formatted = DistanceHelper::format($dist, $viewer->location_precision ?? 'city', $user->location_precision ?? 'city');
                        $distanceKm = $formatted['distance_km'];
                        $distanceLabel = $formatted['distance_label'];
                    }
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'profile_image' => $user->profile_image,
                        'pet_breeds' => $petBreeds,
                        'pet_count' => $user->pets->count(),
                        'distance_km' => $distanceKm,
                        'distance_label' => $distanceLabel,
                    ];
                });
            }

            // Search Shooters
            $shooterRole = Role::where('role_type', 'Shooter')->first();
            $shootersCount = 0;
            $formattedShooters = collect([]);

            if ($shooterRole) {
                $shootersQuery = User::whereHas('roles', function ($q) use ($shooterRole) {
                    $q->where('roles.role_id', $shooterRole->role_id);
                })
                    ->whereHas('userAuth', function ($q) {
                        $q->where('auth_type', 'shooter_certificate')
                            ->where('status', 'approved');
                    })
                    ->where('id', '!=', Auth::id())
                    ->where(function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%")
                            ->orWhere('email', 'like', "%{$query}%");
                    });

                $shootersCount = $shootersQuery->count();
                $shooters = $shootersQuery->limit($limit)->get();

                $formattedShooters = $shooters->map(function ($user) use ($viewer) {
                    $experienceYears = $user->created_at ? ceil($user->created_at->diffInYears(now())) : 0;
                    $distanceKm = null;
                    $distanceLabel = null;
                    if ($viewer && $viewer->hasLocation() && $user->hasLocation()) {
                        $dist = DistanceHelper::haversine($viewer->latitude, $viewer->longitude, $user->latitude, $user->longitude);
                        $formatted = DistanceHelper::format($dist, $viewer->location_precision ?? 'city', $user->location_precision ?? 'city');
                        $distanceKm = $formatted['distance_km'];
                        $distanceLabel = $formatted['distance_label'];
                    }
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'profile_image' => $user->profile_image,
                        'experience_years' => $experienceYears,
                        'distance_km' => $distanceKm,
                        'distance_label' => $distanceLabel,
                    ];
                });
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'pets' => [
                        'count' => $petsCount,
                        'items' => $formattedPets,
                    ],
                    'breeders' => [
                        'count' => $breedersCount,
                        'items' => $formattedBreeders,
                    ],
                    'shooters' => [
                        'count' => $shootersCount,
                        'items' => $formattedShooters,
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to perform global search',
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
                ->where('id', '!=', Auth::id())
                ->with(['pets', 'roles']);

            // Apply text search if query provided
            if (!empty($query)) {
                $shootersQuery->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%");
                });
            }

            $shooters = $shootersQuery->limit(50)->get();

            $viewer = $request->user();
            $formattedShooters = $shooters->map(function ($user) use ($viewer) {
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

                $result = [
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
                    'distance_km' => null,
                    'distance_label' => null,
                ];

                if ($viewer && $viewer->hasLocation() && $user->hasLocation()) {
                    $distance = DistanceHelper::haversine(
                        $viewer->latitude,
                        $viewer->longitude,
                        $user->latitude,
                        $user->longitude
                    );
                    $formatted = DistanceHelper::format(
                        $distance,
                        $viewer->location_precision ?? 'city',
                        $user->location_precision ?? 'city'
                    );
                    $result['distance_km'] = $formatted['distance_km'];
                    $result['distance_label'] = $formatted['distance_label'];
                }

                return $result;
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

    /**
     * Helper: Format a pet model for search/explore responses
     */
    private function formatPetForSearch(Pet $pet, ?User $viewer = null): array
    {
        $primaryPhoto = $pet->photos->where('is_primary', true)->first();

        $result = [
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
            'is_on_cooldown' => $pet->isOnCooldown(),
            'cooldown_days_remaining' => $pet->cooldown_days_remaining,
            'owner' => $pet->owner ? [
                'id' => $pet->owner->id,
                'name' => $pet->owner->name,
                'profile_image' => $pet->owner->profile_image,
            ] : null,
        ];

        // Add distance info if viewer has location
        if ($viewer && $viewer->hasLocation() && $pet->owner && $pet->owner->hasLocation()) {
            $distance = DistanceHelper::haversine(
                $viewer->latitude,
                $viewer->longitude,
                $pet->owner->latitude,
                $pet->owner->longitude
            );
            $formatted = DistanceHelper::format(
                $distance,
                $viewer->location_precision ?? 'city',
                $pet->owner->location_precision ?? 'city'
            );
            $result['distance_km'] = $formatted['distance_km'];
            $result['distance_label'] = $formatted['distance_label'];
        } else {
            $result['distance_km'] = null;
            $result['distance_label'] = null;
        }

        return $result;
    }

    /**
     * Helper: Apply age range filter to a pets query based on birthdate
     */
    private function applyAgeRangeFilter($query, string $ageRange)
    {
        $now = Carbon::now();

        switch ($ageRange) {
            case '<1':
                $query->where('birthdate', '>=', $now->copy()->subYear());
                break;
            case '1-3':
                $query->where('birthdate', '<=', $now->copy()->subYear())
                    ->where('birthdate', '>=', $now->copy()->subYears(3));
                break;
            case '3-5':
                $query->where('birthdate', '<=', $now->copy()->subYears(3))
                    ->where('birthdate', '>=', $now->copy()->subYears(5));
                break;
            case '5+':
                $query->where('birthdate', '<=', $now->copy()->subYears(5));
                break;
        }
    }

    /**
     * Get a specific breeder's public profile
     */
    public function getBreederProfile(Request $request, $id)
    {
        try {
            $breeder = User::with(['roles', 'pets.photos', 'userAuth'])->find($id);

            if (!$breeder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Breeder not found'
                ], 404);
            }

            // Check if user has breeder role
            $hasBreederRole = $breeder->roles->contains(function ($role) {
                return $role->role_type === 'Breeder';
            });

            if (!$hasBreederRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a breeder'
                ], 404);
            }

            // Check ID verification
            $idVerified = $breeder->userAuth->where('auth_type', 'id')
                ->where('status', 'approved')
                ->isNotEmpty();

            if (!$idVerified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Breeder is not verified'
                ], 403);
            }

            $experienceYears = $breeder->created_at ? ceil($breeder->created_at->diffInYears(now())) : 0;

            // Get active pets only
            $approvedPets = $breeder->pets->filter(function ($pet) {
                return $pet->status === 'active';
            });

            // Format pets data
            $petsData = $approvedPets->map(function ($pet) {
                $primaryPhoto = $pet->photos->where('is_primary', true)->first();

                return [
                    'pet_id' => $pet->pet_id,
                    'name' => $pet->name,
                    'breed' => $pet->breed,
                    'species' => $pet->species,
                    'sex' => $pet->sex,
                    'age' => $pet->age,
                    'birthdate' => $pet->birthdate,
                    'profile_image' => $primaryPhoto ? $primaryPhoto->photo_url : $pet->profile_image,
                    'breeding_price' => $pet->breeding_price,
                    'is_on_cooldown' => $pet->is_on_cooldown,
                ];
            })->values()->toArray();

            // Get pet breeds
            $petBreeds = $approvedPets->pluck('breed')->unique()->filter()->values()->toArray();

            // Check breeder certificate verification
            $breederCertVerified = $breeder->userAuth->where('auth_type', 'breeder_certificate')
                ->where('status', 'approved')
                ->isNotEmpty();

            // Count breeding statistics
            $totalPets = $approvedPets->count();
            $dogCount = $approvedPets->where('species', 'dog')->count();
            $catCount = $approvedPets->where('species', 'cat')->count();

            $breederProfile = [
                'id' => $breeder->id,
                'name' => $breeder->name,
                'profile_image' => $breeder->profile_image,
                'sex' => $breeder->sex,
                'birthdate' => $breeder->birthdate,
                'age' => $breeder->birthdate ? ceil(Carbon::parse($breeder->birthdate)->diffInYears(now())) : null,
                'address' => $breeder->address,
                'experience_years' => $experienceYears,
                'pet_breeds' => $petBreeds,
                'pet_count' => $totalPets,
                'pets' => $petsData,
                'id_verified' => $idVerified,
                'breeder_verified' => $breederCertVerified,
                'rating' => null, // TODO: Implement rating system
                'distance_km' => null,
                'distance_label' => null,
                'location' => $breeder->getObfuscatedCoordinates(),
                'statistics' => [
                    'total_pets' => $totalPets,
                    'dog_count' => $dogCount,
                    'cat_count' => $catCount,
                ],
            ];

            // Add distance info
            $viewer = $request->user();
            if ($viewer && $viewer->hasLocation() && $breeder->hasLocation()) {
                $distance = DistanceHelper::haversine(
                    $viewer->latitude,
                    $viewer->longitude,
                    $breeder->latitude,
                    $breeder->longitude
                );
                $formatted = DistanceHelper::format(
                    $distance,
                    $viewer->location_precision ?? 'city',
                    $breeder->location_precision ?? 'city'
                );
                $breederProfile['distance_km'] = $formatted['distance_km'];
                $breederProfile['distance_label'] = $formatted['distance_label'];
            }

            return response()->json([
                'success' => true,
                'data' => $breederProfile
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get breeder profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Map search - returns markers with obfuscated coordinates for map view.
     * Supports filtering by type (breeders, shooters, pets) and optional radius.
     */
    public function mapSearch(Request $request)
    {
        try {
            $viewer = $request->user();
            $types = $request->input('types', ['breeders', 'shooters', 'pets']);
            $radiusKm = $request->input('radius_km');
            $species = $request->input('species');
            $limit = min((int) $request->input('limit', 100), 200);

            if (!$viewer || !$viewer->hasLocation()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location required. Please set your location in profile settings.',
                ], 422);
            }

            $viewerLat = $viewer->latitude;
            $viewerLng = $viewer->longitude;
            $markers = [];

            // Breeders
            if (in_array('breeders', $types)) {
                $breederRole = Role::where('role_type', 'Breeder')->first();
                if ($breederRole) {
                    $query = User::whereNotNull('latitude')
                        ->whereNotNull('longitude')
                        ->where('id', '!=', $viewer->id)
                        ->whereHas('roles', fn($q) => $q->where('roles.role_id', $breederRole->role_id))
                        ->whereHas('userAuth', fn($q) => $q->where('auth_type', 'id')->where('status', 'approved'));

                    if ($radiusKm) {
                        $query->withinRadius($viewerLat, $viewerLng, (float) $radiusKm);
                    }

                    $breeders = $query->withDistance($viewerLat, $viewerLng)
                        ->orderBy('distance')
                        ->limit($limit)
                        ->get();

                    foreach ($breeders as $breeder) {
                        $coords = $breeder->getObfuscatedCoordinates();
                        if (!$coords) continue;
                        $formatted = DistanceHelper::format(
                            $breeder->distance,
                            $viewer->location_precision ?? 'city',
                            $breeder->location_precision ?? 'city'
                        );
                        $markers[] = [
                            'type' => 'breeder',
                            'id' => $breeder->id,
                            'name' => $breeder->name,
                            'profile_image' => $breeder->profile_image,
                            'latitude' => $coords['latitude'],
                            'longitude' => $coords['longitude'],
                            'distance_km' => $formatted['distance_km'],
                            'distance_label' => $formatted['distance_label'],
                            'pet_count' => $breeder->pets()->where('status', 'active')->count(),
                        ];
                    }
                }
            }

            // Shooters
            if (in_array('shooters', $types)) {
                $shooterRole = Role::where('role_type', 'Shooter')->first();
                if ($shooterRole) {
                    $query = User::whereNotNull('latitude')
                        ->whereNotNull('longitude')
                        ->where('id', '!=', $viewer->id)
                        ->whereHas('roles', fn($q) => $q->where('roles.role_id', $shooterRole->role_id))
                        ->whereHas('userAuth', fn($q) => $q->where('auth_type', 'shooter_certificate')->where('status', 'approved'));

                    if ($radiusKm) {
                        $query->withinRadius($viewerLat, $viewerLng, (float) $radiusKm);
                    }

                    $shooters = $query->withDistance($viewerLat, $viewerLng)
                        ->orderBy('distance')
                        ->limit($limit)
                        ->get();

                    foreach ($shooters as $shooter) {
                        $coords = $shooter->getObfuscatedCoordinates();
                        if (!$coords) continue;
                        $formatted = DistanceHelper::format(
                            $shooter->distance,
                            $viewer->location_precision ?? 'city',
                            $shooter->location_precision ?? 'city'
                        );
                        $markers[] = [
                            'type' => 'shooter',
                            'id' => $shooter->id,
                            'name' => $shooter->name,
                            'profile_image' => $shooter->profile_image,
                            'latitude' => $coords['latitude'],
                            'longitude' => $coords['longitude'],
                            'distance_km' => $formatted['distance_km'],
                            'distance_label' => $formatted['distance_label'],
                        ];
                    }
                }
            }

            // Pets (via owner location)
            if (in_array('pets', $types)) {
                $query = Pet::where('status', 'active')
                    ->whereHas('owner', function ($q) {
                        $q->whereNotNull('latitude')->whereNotNull('longitude');
                    })
                    ->with(['owner', 'photos']);

                if ($species) {
                    $query->where('species', $species);
                }

                if ($radiusKm) {
                    $query->whereHas('owner', function ($q) use ($viewerLat, $viewerLng, $radiusKm) {
                        $q->withinRadius($viewerLat, $viewerLng, (float) $radiusKm);
                    });
                }

                $pets = $query->limit($limit)->get();

                foreach ($pets as $pet) {
                    $owner = $pet->owner;
                    if (!$owner || !$owner->hasLocation()) continue;
                    $coords = $owner->getObfuscatedCoordinates();
                    if (!$coords) continue;

                    $dist = DistanceHelper::haversine($viewerLat, $viewerLng, $owner->latitude, $owner->longitude);
                    $formatted = DistanceHelper::format(
                        $dist,
                        $viewer->location_precision ?? 'city',
                        $owner->location_precision ?? 'city'
                    );

                    $primaryPhoto = $pet->photos->where('is_primary', true)->first();
                    $markers[] = [
                        'type' => 'pet',
                        'id' => $pet->pet_id,
                        'name' => $pet->name,
                        'species' => $pet->species,
                        'breed' => $pet->breed,
                        'sex' => $pet->sex,
                        'profile_image' => $primaryPhoto ? $primaryPhoto->photo_url : $pet->profile_image,
                        'latitude' => $coords['latitude'],
                        'longitude' => $coords['longitude'],
                        'distance_km' => $formatted['distance_km'],
                        'distance_label' => $formatted['distance_label'],
                        'owner_name' => $owner->name,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'markers' => $markers,
                    'center' => [
                        'latitude' => $viewerLat,
                        'longitude' => $viewerLng,
                    ],
                    'count' => count($markers),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load map data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
