<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;

class ShooterController extends Controller
{
    /**
     * Get all verified shooters
     */
    public function index(Request $request)
    {
        try {
            // Get the shooter role ID
            $shooterRole = Role::where('role_type', 'shooter')->first();

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
                $experienceYears = $user->created_at ? $user->created_at->diffInYears(now()) : 0;

                // Check if user is also a pet owner
                $isPetOwner = $user->roles->contains(function ($role) {
                    return $role->role_type === 'pet_owner';
                });

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'profile_image' => $user->profile_image,
                    'sex' => $user->sex,
                    'birthdate' => $user->birthdate,
                    'age' => $user->birthdate ? now()->diffInYears($user->birthdate) : null,
                    'experience_years' => $experienceYears,
                    'specialization' => null, // TODO: Add specialization field to users table
                    'is_pet_owner' => $isPetOwner,
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
            $shooter = User::with(['roles', 'pets', 'userAuth'])->find($id);

            if (!$shooter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shooter not found'
                ], 404);
            }

            // Check if user has shooter role
            $hasShooterRole = $shooter->roles->contains(function ($role) {
                return $role->role_type === 'shooter';
            });

            if (!$hasShooterRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a shooter'
                ], 404);
            }

            $experienceYears = $shooter->created_at ? $shooter->created_at->diffInYears(now()) : 0;

            $isPetOwner = $shooter->roles->contains(function ($role) {
                return $role->role_type === 'pet_owner';
            });

            $shooterProfile = [
                'id' => $shooter->id,
                'name' => $shooter->name,
                'email' => $shooter->email,
                'profile_image' => $shooter->profile_image,
                'sex' => $shooter->sex,
                'birthdate' => $shooter->birthdate,
                'age' => $shooter->birthdate ? now()->diffInYears($shooter->birthdate) : null,
                'contact_number' => $shooter->contact_number,
                'address' => $shooter->address,
                'experience_years' => $experienceYears,
                'specialization' => null,
                'is_pet_owner' => $isPetOwner,
                'rating' => null,
                'completed_sessions' => null,
                'verification_status' => $shooter->userAuth->where('auth_type', 'shooter_certificate')->first()?->status ?? 'pending',
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
