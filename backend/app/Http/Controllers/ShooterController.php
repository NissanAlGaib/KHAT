<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
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
}
