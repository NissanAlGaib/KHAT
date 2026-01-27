<?php

namespace App\Http\Controllers;

use App\Models\Pet;
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

            // Get user's active pets with partner preferences
            $userPets = Pet::where('user_id', $user->id)
                ->where('status', 'active')
                ->with('partnerPreferences')
                ->get();

            if ($userPets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active pets found',
                    'data' => [],
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

            // Get user's active pets
            $userPets = Pet::where('user_id', $user->id)
                ->where('status', 'active')
                ->with(['partnerPreferences', 'photos'])
                ->get();

            if ($userPets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active pets found',
                    'data' => [],
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
     * Calculate compatibility score between two pets using MLP-like architecture
     *
     * This implementation mimics a multilayer perceptron with:
     * - Input layer: Feature extraction and normalization
     * - Hidden layer: Non-linear transformations and feature interactions
     * - Output layer: Final score calculation with activation
     */
    private function calculateCompatibilityScore($pet, $userPet)
    {
        $reasons = [];
        $preferences = $userPet->partnerPreferences->first();

        if (! $preferences) {
            return ['score' => 50, 'reasons' => ['No specific preferences set']];
        }

        // ============================================
        // INPUT LAYER: Feature extraction & normalization
        // ============================================
        $inputFeatures = $this->extractInputFeatures($pet, $userPet, $preferences);

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
    private function extractInputFeatures($pet, $userPet, $preferences): array
    {
        $features = [];

        // Breed feature (exact match = 1.0, same species different breed = 0.3, no match = 0)
        $features['breed'] = 0.0;
        if ($preferences->preferred_breed) {
            if ($pet->breed === $preferences->preferred_breed) {
                $features['breed'] = 1.0;
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

        return $hidden;
    }

    /**
     * Output Layer: Compute final compatibility score with activation
     */
    private function computeOutputLayer(array $hiddenActivations, array $inputFeatures, array &$reasons): array
    {
        // Output layer weights
        $outputWeights = [
            'primary' => 0.45,
            'secondary' => 0.25,
            'interaction' => 0.15,
            'bonus' => 0.15,
        ];

        // Compute weighted sum of hidden layer outputs
        $outputSum =
            $hiddenActivations['primary'] * $outputWeights['primary'] +
            $hiddenActivations['secondary'] * $outputWeights['secondary'] +
            $hiddenActivations['interaction'] * $outputWeights['interaction'] +
            $hiddenActivations['bonus'] * $outputWeights['bonus'];

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
}
