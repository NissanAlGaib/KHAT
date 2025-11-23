<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    /**
     * Get potential pet matches for the authenticated user's pets
     * Based on partner preferences and compatibility
     */
    public function getPotentialMatches(Request $request)
    {
        try {
            $user = $request->user();

            // Get user's active pets with partner preferences
            $userPets = Pet::where('user_id', $user->id)
                ->where('status', 'active')
                ->with('partnerPreferences')
                ->get();

            if ($userPets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active pets found',
                    'data' => []
                ]);
            }

            // Get all other active pets (not owned by the user)
            $potentialMatches = Pet::where('user_id', '!=', $user->id)
                ->where('status', 'active')
                ->with(['owner:id,name,profile_image', 'photos'])
                ->get();

            // Calculate compatibility scores
            $matches = $potentialMatches->map(function ($pet) use ($userPets) {
                $compatibility = $this->calculateCompatibilityScore($pet, $userPets->first());

                return [
                    'pet_id' => $pet->pet_id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'breed' => $pet->breed,
                    'sex' => $pet->sex,
                    'birthdate' => $pet->birthdate,
                    'age' => $pet->age,
                    'behaviors' => $pet->behaviors,
                    'attributes' => $pet->attributes,
                    'profile_image' => $pet->profile_image,
                    'photos' => $pet->photos->map(function ($photo) {
                        return [
                            'photo_url' => $photo->photo_url,
                            'is_primary' => $photo->is_primary,
                        ];
                    }),
                    'owner' => [
                        'id' => $pet->owner->id,
                        'name' => $pet->owner->name,
                        'profile_image' => $pet->owner->profile_image,
                    ],
                    'compatibility_score' => $compatibility['score'],
                    'match_reasons' => $compatibility['reasons'],
                ];
            });

            // Sort by compatibility score
            $sortedMatches = $matches->sortByDesc('compatibility_score')->values();

            return response()->json([
                'success' => true,
                'data' => $sortedMatches
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get potential matches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get top matches for the user
     */
    public function getTopMatches(Request $request)
    {
        try {
            $user = $request->user();

            // Get user's active pets
            $userPets = Pet::where('user_id', $user->id)
                ->where('status', 'active')
                ->with(['partnerPreferences', 'photos'])
                ->get();

            if ($userPets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active pets found',
                    'data' => []
                ]);
            }

            // Get potential matches
            $potentialMatches = Pet::where('user_id', '!=', $user->id)
                ->where('status', 'active')
                ->with('photos')
                ->get();

            $topMatches = [];

            foreach ($userPets as $userPet) {
                $bestMatch = null;
                $bestScore = 0;

                foreach ($potentialMatches as $potentialPet) {
                    $compatibility = $this->calculateCompatibilityScore($potentialPet, $userPet);

                    if ($compatibility['score'] > $bestScore) {
                        $bestScore = $compatibility['score'];
                        $bestMatch = $potentialPet;
                    }
                }

                // Show match if there's any potential match (removed 50% threshold)
                if ($bestMatch) {
                    $primaryPhoto1 = $userPet->photos->firstWhere('is_primary', true) ?? $userPet->photos->first();
                    $primaryPhoto2 = $bestMatch->photos->firstWhere('is_primary', true) ?? $bestMatch->photos->first();

                    $topMatches[] = [
                        'pet1' => [
                            'pet_id' => $userPet->pet_id,
                            'name' => $userPet->name,
                            'photo_url' => $primaryPhoto1?->photo_url,
                        ],
                        'pet2' => [
                            'pet_id' => $bestMatch->pet_id,
                            'name' => $bestMatch->name,
                            'photo_url' => $primaryPhoto2?->photo_url,
                        ],
                        'compatibility_score' => $bestScore,
                        'match_reasons' => $compatibility['reasons'],
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $topMatches
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get top matches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate compatibility score between two pets
     */
    private function calculateCompatibilityScore($pet, $userPet)
    {
        $score = 0;
        $reasons = [];
        $preferences = $userPet->partnerPreferences->first();

        if (!$preferences) {
            // No preferences set, return base score
            return ['score' => 50, 'reasons' => ['No specific preferences set']];
        }

        // Breed match (40 points)
        if ($preferences->preferred_breed && $pet->breed === $preferences->preferred_breed) {
            $score += 40;
            $reasons[] = 'Perfect breed match';
        }

        // Sex preference (20 points)
        if ($preferences->preferred_sex && $pet->sex === $preferences->preferred_sex) {
            $score += 20;
            $reasons[] = 'Sex preference match';
        }

        // Age range (20 points)
        if ($preferences->min_age && $preferences->max_age) {
            $petAgeInMonths = $pet->birthdate->diffInMonths(now());
            if ($petAgeInMonths >= $preferences->min_age && $petAgeInMonths <= $preferences->max_age) {
                $score += 20;
                $reasons[] = 'Age within preferred range';
            }
        }

        // Behaviors match (10 points)
        if ($preferences->preferred_behaviors && $pet->behaviors) {
            $matchingBehaviors = array_intersect($preferences->preferred_behaviors, $pet->behaviors);
            if (count($matchingBehaviors) > 0) {
                $score += 10;
                $reasons[] = 'Matching behaviors';
            }
        }

        // Attributes match (10 points)
        if ($preferences->preferred_attributes && $pet->attributes) {
            $matchingAttributes = array_intersect($preferences->preferred_attributes, $pet->attributes);
            if (count($matchingAttributes) > 0) {
                $score += 10;
                $reasons[] = 'Matching attributes';
            }
        }

        // Ensure score doesn't exceed 100
        $score = min($score, 100);

        if (empty($reasons)) {
            $reasons[] = 'General compatibility';
        }

        return ['score' => $score, 'reasons' => $reasons];
    }
}
