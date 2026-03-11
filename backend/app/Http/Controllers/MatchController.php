<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\MatchRequest;
use App\Helpers\DistanceHelper;
use Illuminate\Http\Request;

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

            // Get blocked user IDs to exclude from matches
            $blockedUserIds = $user->getBlockedUserIds();

            // Get user's active pets with partner preferences (excluding pets on cooldown)
            $userPets = Pet::where('user_id', $user->id)
                ->availableForMatching()
                ->with('partnerPreferences')
                ->get();

            if ($userPets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active pets found',
                    'data' => [],
                ]);
            }

            // Get all other pets available for matching (not owned by the user, not on cooldown, not owned by blocked users)
            // Only show opposite-sex pets (breeding requires male + female)
            $userPetSexes = $userPets->pluck('sex')->unique()->toArray();
            $query = Pet::where('user_id', '!=', $user->id)
                ->availableForMatching()
                ->with(['owner:id,name,profile_image,latitude,longitude,location_precision,prefer_nearby_matches', 'photos']);

            // Filter to opposite sex only (if user has only male pets, show only female, and vice versa)
            if (count($userPetSexes) === 1) {
                $oppositeSex = $userPetSexes[0] === 'Male' ? 'Female' : 'Male';
                $query->where('sex', $oppositeSex);
            }

            // Only add whereNotIn if there are blocked users
            if (!empty($blockedUserIds)) {
                $query->whereNotIn('user_id', $blockedUserIds);
            }

            $potentialMatches = $query->get();

            // Calculate compatibility scores
            $matches = $potentialMatches->map(function ($pet) use ($user, $userPets) {
                $compatibility = $this->calculateCompatibilityScore($pet, $userPets->first(), $user);

                $distanceKm = null;
                $distanceLabel = null;
                if ($user->hasLocation() && $pet->owner && $pet->owner->hasLocation()) {
                    $dist = DistanceHelper::haversine($user->latitude, $user->longitude, $pet->owner->latitude, $pet->owner->longitude);
                    $formatted = DistanceHelper::format($dist, $user->location_precision ?? 'city', $pet->owner->location_precision ?? 'city');
                    $distanceKm = $formatted['distance_km'];
                    $distanceLabel = $formatted['distance_label'];
                }

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
                    'distance_km' => $distanceKm,
                    'distance_label' => $distanceLabel,
                ];
            });

            // Sort by compatibility score
            $sortedMatches = $matches->sortByDesc('compatibility_score')->values();

            return response()->json([
                'success' => true,
                'data' => $sortedMatches,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get potential matches',
                'error' => $e->getMessage(),
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

            // Get blocked user IDs to exclude from matches
            $blockedUserIds = $user->getBlockedUserIds();

            // Get user's active pets (excluding pets on cooldown)
            $userPets = Pet::where('user_id', $user->id)
                ->availableForMatching()
                ->with(['partnerPreferences', 'photos'])
                ->get();

            if ($userPets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active pets found',
                    'data' => [],
                ]);
            }

            // Get potential matches (not owned by user, not on cooldown, not owned by blocked users)
            $query = Pet::where('user_id', '!=', $user->id)
                ->availableForMatching()
                ->with(['owner:id,latitude,longitude,location_precision,prefer_nearby_matches', 'photos']);

            // Only add whereNotIn if there are blocked users
            if (!empty($blockedUserIds)) {
                $query->whereNotIn('user_id', $blockedUserIds);
            }

            $potentialMatches = $query->get();

            // Get pet IDs that have active (pending/accepted) match requests with user's pets
            $userPetIds = $userPets->pluck('pet_id')->toArray();
            $activeRequestPairs = MatchRequest::where(function ($query) use ($userPetIds) {
                $query->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            })->whereIn('status', ['pending', 'accepted'])
                ->get()
                ->map(function ($request) use ($userPetIds) {
                    // Return the pair as [userPetId => otherPetId]
                    if (in_array($request->requester_pet_id, $userPetIds)) {
                        return ['user_pet' => $request->requester_pet_id, 'other_pet' => $request->target_pet_id];
                    }
                    return ['user_pet' => $request->target_pet_id, 'other_pet' => $request->requester_pet_id];
                });

            $topMatches = [];

            foreach ($userPets as $userPet) {
                // Build set of pet IDs that have active requests with this user pet
                $excludedPetIds = $activeRequestPairs
                    ->where('user_pet', $userPet->pet_id)
                    ->pluck('other_pet')
                    ->toArray();

                foreach ($potentialMatches as $potentialPet) {
                    // Skip pets of a different species (e.g. Dog should not match with Cat)
                    if ($potentialPet->species !== $userPet->species) {
                        continue;
                    }

                    // Skip same-sex pets (breeding requires male + female)
                    if ($potentialPet->sex === $userPet->sex) {
                        continue;
                    }

                    // Skip pets that already have an active match request with this user pet
                    if (in_array($potentialPet->pet_id, $excludedPetIds)) {
                        continue;
                    }

                    $compatibility = $this->calculateCompatibilityScore($potentialPet, $userPet, $user);

                    $primaryPhoto1 = $userPet->photos->firstWhere('is_primary', true) ?? $userPet->photos->first();
                    $primaryPhoto2 = $potentialPet->photos->firstWhere('is_primary', true) ?? $potentialPet->photos->first();

                    $topMatches[] = [
                        'pet1' => [
                            'pet_id' => $userPet->pet_id,
                            'name' => $userPet->name,
                            'photo_url' => $primaryPhoto1?->photo_url,
                            'breed' => $userPet->breed,
                            'species' => $userPet->species,
                            'sex' => $userPet->sex,
                            'birthdate' => $userPet->birthdate,
                        ],
                        'pet2' => [
                            'pet_id' => $potentialPet->pet_id,
                            'name' => $potentialPet->name,
                            'photo_url' => $primaryPhoto2?->photo_url,
                            'breed' => $potentialPet->breed,
                            'species' => $potentialPet->species,
                            'sex' => $potentialPet->sex,
                            'birthdate' => $potentialPet->birthdate,
                        ],
                        'compatibility_score' => $compatibility['score'],
                        'match_reasons' => $compatibility['reasons'],
                    ];
                }
            }

            // Sort all matches by compatibility score descending
            usort($topMatches, fn($a, $b) => $b['compatibility_score'] <=> $a['compatibility_score']);

            return response()->json([
                'success' => true,
                'data' => $topMatches,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get top matches',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get compatibility score between two specific pets
     */
    public function getCompatibilityScore(Request $request, $petId, $otherPetId)
    {
        try {
            $userPet = Pet::with(['partnerPreferences', 'owner:id,latitude,longitude,location_precision,prefer_nearby_matches'])->findOrFail($petId);
            $otherPet = Pet::with(['partnerPreferences', 'owner:id,latitude,longitude,location_precision,prefer_nearby_matches'])->findOrFail($otherPetId);

            // Verify the requesting user owns the user pet
            if ($userPet->user_id !== $request->user()->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $result = $this->calculateCompatibilityScore($otherPet, $userPet, $request->user());

            // Also calculate reverse compatibility
            $reverseResult = $this->calculateCompatibilityScore($userPet, $otherPet, $request->user());

            // Feature breakdown for detailed view
            $preferences = $userPet->partnerPreferences->first();
            $breakdown = [
                'breed_match' => false,
                'sex_match' => false,
                'age_in_range' => false,
                'behavior_matches' => [],
                'attribute_matches' => [],
            ];

            if ($preferences) {
                $breakdown['breed_match'] = $preferences->preferred_breed
                    ? ($otherPet->breed === $preferences->preferred_breed || $this->breedMatchesMixed($otherPet->breed, $preferences->preferred_breed))
                    : true;
                $breakdown['sex_match'] = $preferences->preferred_sex
                    ? $otherPet->sex === $preferences->preferred_sex
                    : true;
                if ($preferences->min_age && $preferences->max_age && $otherPet->birthdate) {
                    $ageMonths = $otherPet->birthdate->diffInMonths(now());
                    $breakdown['age_in_range'] = $ageMonths >= $preferences->min_age && $ageMonths <= $preferences->max_age;
                }
                if ($preferences->preferred_behaviors && $otherPet->behaviors) {
                    $prefBehaviors = is_array($preferences->preferred_behaviors) ? $preferences->preferred_behaviors : json_decode($preferences->preferred_behaviors, true) ?? [];
                    $petBehaviors = is_array($otherPet->behaviors) ? $otherPet->behaviors : json_decode($otherPet->behaviors, true) ?? [];
                    $breakdown['behavior_matches'] = array_values(array_intersect($prefBehaviors, $petBehaviors));
                }
                if ($preferences->preferred_attributes && $otherPet->attributes) {
                    $prefAttributes = is_array($preferences->preferred_attributes) ? $preferences->preferred_attributes : json_decode($preferences->preferred_attributes, true) ?? [];
                    $petAttributes = is_array($otherPet->attributes) ? $otherPet->attributes : json_decode($otherPet->attributes, true) ?? [];
                    $breakdown['attribute_matches'] = array_values(array_intersect($prefAttributes, $petAttributes));
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'compatibility_score' => $result['score'],
                    'match_reasons' => $result['reasons'],
                    'reverse_score' => $reverseResult['score'],
                    'reverse_reasons' => $reverseResult['reasons'],
                    'breakdown' => $breakdown,
                    'user_pet' => [
                        'pet_id' => $userPet->pet_id,
                        'name' => $userPet->name,
                    ],
                    'other_pet' => [
                        'pet_id' => $otherPet->pet_id,
                        'name' => $otherPet->name,
                    ],
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Pet not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to calculate compatibility'], 500);
        }
    }

    /**
     * Calculate compatibility score between two pets using MLP-like architecture
     *
     * This implementation mimics a multilayer perceptron with:
     * - Input layer: Feature extraction and normalization
     * - Hidden layer: Non-linear transformations and feature interactions
     * - Output layer: Final score calculation with activation
     */
    private function calculateCompatibilityScore($pet, $userPet, $viewer = null)
    {
        $reasons = [];
        $preferences = $userPet->partnerPreferences->first();

        if (! $preferences) {
            return ['score' => 50, 'reasons' => ['No specific preferences set']];
        }

        // ============================================
        // INPUT LAYER: Feature extraction & normalization
        // ============================================
        $inputFeatures = $this->extractInputFeatures($pet, $userPet, $preferences, $viewer);

        // ============================================
        // HIDDEN LAYER: Non-linear transformations & interactions
        // ============================================
        $hiddenActivations = $this->computeHiddenLayer($inputFeatures);

        // ============================================
        // OUTPUT LAYER: Final score with activation
        // ============================================
        $result = $this->computeOutputLayer($hiddenActivations, $inputFeatures, $reasons);

        return $result;
    }

    /**
     * Input Layer: Extract and normalize features from pet data
     * Returns normalized values between 0 and 1
     */
    private function extractInputFeatures($pet, $userPet, $preferences, $viewer = null): array
    {
        $features = [];

        // Breed feature (exact match = 1.0, mixed breed parent match = 0.8, same species different breed = 0.3, no match = 0)
        // Supports mixed breeds ("Breed1 × Breed2 Mix") by checking if either parent breed matches
        $features['breed'] = 0.0;
        if ($preferences->preferred_breed) {
            if ($pet->breed === $preferences->preferred_breed) {
                $features['breed'] = 1.0;
            } elseif ($this->breedMatchesMixed($pet->breed, $preferences->preferred_breed)) {
                $features['breed'] = 0.8;
            } elseif ($pet->species === $userPet->species) {
                $features['breed'] = 0.3;
            }
        }

        // Sex feature (exact match = 1.0, no preference = 0.5, no match = 0)
        $features['sex'] = 0.5;
        if ($preferences->preferred_sex) {
            $features['sex'] = $pet->sex === $preferences->preferred_sex ? 1.0 : 0.0;
        }

        // Age feature (normalized based on distance from preferred range)
        $features['age'] = 0.5;
        if ($preferences->min_age && $preferences->max_age && $pet->birthdate) {
            $petAgeInMonths = $pet->birthdate->diffInMonths(now());
            $midAge = ($preferences->min_age + $preferences->max_age) / 2;
            $ageRange = $preferences->max_age - $preferences->min_age;

            if ($petAgeInMonths >= $preferences->min_age && $petAgeInMonths <= $preferences->max_age) {
                // Gaussian-like normalization within range (closer to mid = higher score)
                $distanceFromMid = abs($petAgeInMonths - $midAge);
                $normalizedDistance = $ageRange > 0 ? $distanceFromMid / ($ageRange / 2) : 0;
                $features['age'] = 1.0 - (0.2 * $normalizedDistance);
            } else {
                // Outside range - decay based on distance
                $distanceOutside = min(
                    abs($petAgeInMonths - $preferences->min_age),
                    abs($petAgeInMonths - $preferences->max_age)
                );
                $features['age'] = max(0.0, 0.4 - ($distanceOutside / ($ageRange ?: 12)) * 0.3);
            }
        }

        // Behaviors feature (ratio of matching behaviors with bonus for multiple matches)
        $features['behaviors'] = 0.0;
        $features['behaviors_count'] = 0;
        if ($preferences->preferred_behaviors && $pet->behaviors) {
            $preferredBehaviors = is_array($preferences->preferred_behaviors)
                ? $preferences->preferred_behaviors
                : json_decode($preferences->preferred_behaviors, true) ?? [];
            $petBehaviors = is_array($pet->behaviors)
                ? $pet->behaviors
                : json_decode($pet->behaviors, true) ?? [];

            $matchingBehaviors = array_intersect($preferredBehaviors, $petBehaviors);
            $matchCount = count($matchingBehaviors);
            $totalPreferred = count($preferredBehaviors);

            if ($totalPreferred > 0) {
                $features['behaviors'] = $matchCount / $totalPreferred;
                $features['behaviors_count'] = $matchCount;
            }
        }

        // Attributes feature (similar to behaviors)
        $features['attributes'] = 0.0;
        $features['attributes_count'] = 0;
        if ($preferences->preferred_attributes && $pet->attributes) {
            $preferredAttributes = is_array($preferences->preferred_attributes)
                ? $preferences->preferred_attributes
                : json_decode($preferences->preferred_attributes, true) ?? [];
            $petAttributes = is_array($pet->attributes)
                ? $pet->attributes
                : json_decode($pet->attributes, true) ?? [];

            $matchingAttributes = array_intersect($preferredAttributes, $petAttributes);
            $matchCount = count($matchingAttributes);
            $totalPreferred = count($preferredAttributes);

            if ($totalPreferred > 0) {
                $features['attributes'] = $matchCount / $totalPreferred;
                $features['attributes_count'] = $matchCount;
            }
        }

        // Location proximity feature (opt-in: both users must enable prefer_nearby_matches)
        $features['location'] = -1; // sentinel: not applicable
        $features['location_active'] = false;
        if ($viewer && $viewer->prefer_nearby_matches && $viewer->hasLocation()) {
            $petOwner = $pet->owner;
            if ($petOwner && $petOwner->prefer_nearby_matches && $petOwner->hasLocation()) {
                $features['location_active'] = true;
                $distKm = DistanceHelper::haversine(
                    $viewer->latitude,
                    $viewer->longitude,
                    $petOwner->latitude,
                    $petOwner->longitude
                );
                $decayFactor = config('matching.location.decay_factor', 100);
                $features['location'] = exp(-$distKm / $decayFactor);
                $features['location_distance_km'] = $distKm;
            }
        }

        return $features;
    }

    /**
     * Hidden Layer: Apply non-linear transformations and compute feature interactions
     */
    private function computeHiddenLayer(array $inputFeatures): array
    {
        $hidden = [];

        // Weights for hidden layer neurons (simulating learned weights)
        $weights = [
            'breed' => 0.35,
            'sex' => 0.15,
            'age' => 0.20,
            'behaviors' => 0.15,
            'attributes' => 0.15,
        ];

        // Hidden Neuron 1: Primary compatibility (weighted sum with ReLU)
        $primarySum =
            $inputFeatures['breed'] * $weights['breed'] +
            $inputFeatures['sex'] * $weights['sex'] +
            $inputFeatures['age'] * $weights['age'];
        $hidden['primary'] = $this->relu($primarySum);

        // Hidden Neuron 2: Secondary compatibility (behaviors & attributes interaction)
        $secondarySum =
            $inputFeatures['behaviors'] * $weights['behaviors'] +
            $inputFeatures['attributes'] * $weights['attributes'];
        // Apply sigmoid for smooth activation
        $hidden['secondary'] = $this->sigmoid($secondarySum * 3);

        // Hidden Neuron 3: Feature interaction term (multiplicative interaction)
        // Captures synergy between good breed match AND good behavior match
        $interactionTerm = $inputFeatures['breed'] * $inputFeatures['behaviors'] * 0.5 +
            $inputFeatures['breed'] * $inputFeatures['attributes'] * 0.3 +
            $inputFeatures['age'] * $inputFeatures['sex'] * 0.2;
        $hidden['interaction'] = $this->tanh($interactionTerm);

        // Hidden Neuron 4: Bonus neuron for multiple feature matches
        $matchBonus = 0;
        if ($inputFeatures['breed'] >= 0.9) {
            $matchBonus += 0.3;
        }
        if ($inputFeatures['sex'] >= 0.9) {
            $matchBonus += 0.2;
        }
        if ($inputFeatures['age'] >= 0.8) {
            $matchBonus += 0.2;
        }
        if ($inputFeatures['behaviors_count'] >= 2) {
            $matchBonus += 0.15;
        }
        if ($inputFeatures['attributes_count'] >= 2) {
            $matchBonus += 0.15;
        }
        $hidden['bonus'] = $this->sigmoid($matchBonus * 2);

        // Hidden Neuron 5: Proximity (only active when both users opted in)
        if ($inputFeatures['location_active']) {
            $hidden['proximity'] = $this->sigmoid($inputFeatures['location'] * 3 - 1);
        } else {
            $hidden['proximity'] = null;
        }

        return $hidden;
    }

    /**
     * Output Layer: Compute final compatibility score with activation
     */
    private function computeOutputLayer(array $hiddenActivations, array $inputFeatures, array &$reasons): array
    {
        // Output layer weights (redistributed when location is active)
        if ($hiddenActivations['proximity'] !== null) {
            $outputWeights = [
                'primary' => 0.38,
                'secondary' => 0.22,
                'interaction' => 0.13,
                'bonus' => 0.12,
                'proximity' => 0.15,
            ];
            $outputSum =
                $hiddenActivations['primary'] * $outputWeights['primary'] +
                $hiddenActivations['secondary'] * $outputWeights['secondary'] +
                $hiddenActivations['interaction'] * $outputWeights['interaction'] +
                $hiddenActivations['bonus'] * $outputWeights['bonus'] +
                $hiddenActivations['proximity'] * $outputWeights['proximity'];
        } else {
            $outputWeights = [
                'primary' => 0.45,
                'secondary' => 0.25,
                'interaction' => 0.15,
                'bonus' => 0.15,
            ];
            $outputSum =
                $hiddenActivations['primary'] * $outputWeights['primary'] +
                $hiddenActivations['secondary'] * $outputWeights['secondary'] +
                $hiddenActivations['interaction'] * $outputWeights['interaction'] +
                $hiddenActivations['bonus'] * $outputWeights['bonus'];
        }

        // Apply sigmoid activation and scale to 0-100
        $rawScore = $this->sigmoid($outputSum * 4) * 100;

        // Apply softplus for smooth lower bound (ensures minimum score)
        $finalScore = $this->softplus($rawScore - 10) + 10;
        $finalScore = min(100, max(0, round($finalScore)));

        // Generate reasons based on input features
        if ($inputFeatures['breed'] >= 0.9) {
            $reasons[] = 'Perfect breed match';
        } elseif ($inputFeatures['breed'] >= 0.3) {
            $reasons[] = 'Compatible species';
        }

        if ($inputFeatures['sex'] >= 0.9) {
            $reasons[] = 'Sex preference match';
        }

        if ($inputFeatures['age'] >= 0.8) {
            $reasons[] = 'Age within preferred range';
        } elseif ($inputFeatures['age'] >= 0.4) {
            $reasons[] = 'Age close to preferred range';
        }

        if ($inputFeatures['behaviors'] >= 0.5) {
            $reasons[] = 'Matching behaviors';
        }

        if ($inputFeatures['attributes'] >= 0.5) {
            $reasons[] = 'Matching attributes';
        }

        // Add interaction-based reason
        if ($hiddenActivations['interaction'] > 0.3) {
            $reasons[] = 'Strong overall compatibility';
        }

        // Add proximity reason when location is active
        if ($hiddenActivations['proximity'] !== null && isset($inputFeatures['location_distance_km'])) {
            $nearbyKm = config('matching.location.nearby_threshold_km', 50);
            if ($inputFeatures['location_distance_km'] <= $nearbyKm) {
                $reasons[] = 'Nearby breeder';
            }
        }

        if (empty($reasons)) {
            $reasons[] = 'General compatibility';
        }

        return ['score' => $finalScore, 'reasons' => $reasons];
    }

    /**
     * ReLU activation function
     */
    private function relu(float $x): float
    {
        return max(0, $x);
    }

    /**
     * Sigmoid activation function
     */
    private function sigmoid(float $x): float
    {
        return 1 / (1 + exp(-$x));
    }

    /**
     * Tanh activation function
     */
    private function tanh(float $x): float
    {
        return tanh($x);
    }

    /**
     * Softplus activation function (smooth ReLU)
     * Uses numerically stable implementation to avoid overflow
     */
    private function softplus(float $x): float
    {
        return $x > 20 ? $x : log(1 + exp($x));
    }

    /**
     * Check if a breed string (possibly mixed) matches a target breed.
     * Supports mixed breed format "Breed1 × Breed2 Mix" by checking if either parent matches.
     */
    private function breedMatchesMixed(?string $petBreed, string $targetBreed): bool
    {
        if (!$petBreed || !str_contains($petBreed, '×')) {
            return false;
        }

        $parts = array_map(function ($part) {
            return trim(preg_replace('/\s*Mix$/i', '', trim($part)));
        }, explode('×', $petBreed));

        foreach ($parts as $parentBreed) {
            if (strcasecmp($parentBreed, $targetBreed) === 0) {
                return true;
            }
        }

        return false;
    }
}
