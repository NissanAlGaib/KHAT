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
     * TODO: Implement actual logic for calculating these statistics
     */
    public function getStatistics(Request $request)
    {
        $user = $request->user();

        // TODO: Implement actual calculations based on:
        // - Current breeding: Count of active breeding sessions
        // - Total matches: Count of all successful matches
        // - Success rate: Percentage of successful breeding
        // - Income: Total earnings from breeding services

        // For now, return placeholder data
        return response()->json([
            'current_breeding' => 0,
            'total_matches' => 0,
            'success_rate' => 0,
            'income' => 0.00,
        ]);
    }
}
