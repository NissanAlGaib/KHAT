<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Get the authenticated user's profile with relationships
     */
    public function getProfile(Request $request)
    {
        $user = $request->user()->load(['roles', 'userAuth']);

        return response()->json($user);
    }

    /**
     * Update the authenticated user's profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'firstName' => 'sometimes|string|max:255',
            'lastName' => 'sometimes|string|max:255',
            'contact_number' => 'sometimes|string|max:20',
            'birthdate' => 'sometimes|date',
            'sex' => 'sometimes|in:male,female,other',
            'address' => 'sometimes|string',
            'profile_image' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Update basic fields
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('firstName')) {
            $user->firstName = $request->firstName;
        }
        if ($request->has('lastName')) {
            $user->lastName = $request->lastName;
        }
        if ($request->has('contact_number')) {
            $user->contact_number = $request->contact_number;
        }
        if ($request->has('birthdate')) {
            $user->birthdate = $request->birthdate;
        }
        if ($request->has('sex')) {
            $user->sex = $request->sex;
        }
        if ($request->has('address')) {
            $user->address = $request->address;
        }

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old profile image if exists
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }

            $path = $request->file('profile_image')->store('profile_images', 'public');
            $user->profile_image = $path;
        }

        $user->save();

        return response()->json($user);
    }

    /**
     * Upload or update profile image
     */
    public function updateProfileImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Delete old profile image if exists
        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $path = $request->file('profile_image')->store('profile_images', 'public');
        $user->profile_image = $path;
        $user->save();

        return response()->json([
            'message' => 'Profile image updated successfully',
            'profile_image' => $path,
        ]);
    }

    /**
     * Get user statistics for breeding overview
     */
    public function getStatistics(Request $request)
    {
        $user = $request->user();

        // Get all pet IDs owned by the user
        $petIds = $user->pets()->pluck('pet_id');

        // Current breeding: Count of active breeding contracts (accepted but not fulfilled)
        // This shows pets that are currently in an active breeding arrangement
        $currentBreeding = \App\Models\BreedingContract::where('status', 'accepted')
            ->whereHas('conversation.matchRequest', function ($query) use ($petIds) {
                $query->whereIn('requester_pet_id', $petIds)
                    ->orWhereIn('target_pet_id', $petIds);
            })
            ->count();

        // Total matches: Count of all successful matches (completed or fulfilled contracts)
        // plus accepted contracts that are still in progress
        $totalMatches = \App\Models\BreedingContract::whereIn('status', ['accepted', 'fulfilled'])
            ->whereHas('conversation.matchRequest', function ($query) use ($petIds) {
                $query->whereIn('requester_pet_id', $petIds)
                    ->orWhereIn('target_pet_id', $petIds);
            })
            ->count();

        // Success rate: Percentage of completed litters with alive offspring
        $littersWithData = \App\Models\Litter::where(function ($query) use ($petIds) {
            $query->whereIn('sire_id', $petIds)
                ->orWhereIn('dam_id', $petIds);
        })
            ->where('total_offspring', '>', 0)
            ->get();

        $successRate = 0;
        if ($littersWithData->count() > 0) {
            $successfulLitters = $littersWithData->filter(function ($litter) {
                return $litter->alive_offspring > 0;
            })->count();
            $successRate = round(($successfulLitters / $littersWithData->count()) * 100);
        }

        // Income: Calculate based on breeding contracts
        // Sum monetary amounts from fulfilled contracts where user received payment
        $income = \App\Models\BreedingContract::where('status', 'fulfilled')
            ->where('include_monetary_amount', true)
            ->whereHas('conversation.matchRequest', function ($query) use ($petIds) {
                // User gets payment when their pet is the dam (female) in most cases
                $query->whereIn('target_pet_id', $petIds);
            })
            ->sum('monetary_amount');

        return response()->json([
            'current_breeding' => $currentBreeding,
            'total_matches' => $totalMatches,
            'success_rate' => $successRate,
            'income' => (float) $income,
        ]);
    }
}
