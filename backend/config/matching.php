<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Compatibility Weights
    |--------------------------------------------------------------------------
    |
    | These weights determine how much each factor contributes to the overall
    | compatibility score between two pets. Weights should sum to 1.0 (100%).
    |
    */

    'weights' => [
        'breed' => env('MATCHING_WEIGHT_BREED', 0.35),
        'age' => env('MATCHING_WEIGHT_AGE', 0.15),
        'behaviors' => env('MATCHING_WEIGHT_BEHAVIORS', 0.20),
        'attributes' => env('MATCHING_WEIGHT_ATTRIBUTES', 0.15),
        'preferences' => env('MATCHING_WEIGHT_PREFERENCES', 0.15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compatibility Thresholds
    |--------------------------------------------------------------------------
    |
    | These thresholds define minimum scores for various matching features.
    |
    */

    'thresholds' => [
        // Minimum overall score to be considered a potential match
        'minimum_match' => env('MATCHING_THRESHOLD_MINIMUM', 0.3),

        // Score threshold for "high compatibility" label
        'high_compatibility' => env('MATCHING_THRESHOLD_HIGH', 0.8),

        // Score threshold for "excellent compatibility" label
        'excellent_compatibility' => env('MATCHING_THRESHOLD_EXCELLENT', 0.9),

        // Minimum score to show in top matches
        'top_match' => env('MATCHING_THRESHOLD_TOP', 0.5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Scoring Parameters
    |--------------------------------------------------------------------------
    |
    | Parameters used in the compatibility scoring algorithm.
    |
    */

    'scoring' => [
        // Age difference tolerance in years (full score within this range)
        'age_tolerance_years' => env('MATCHING_AGE_TOLERANCE', 2),

        // Maximum age difference before score becomes 0
        'age_max_difference_years' => env('MATCHING_AGE_MAX_DIFF', 5),

        // Bonus for exact breed match
        'exact_breed_bonus' => env('MATCHING_EXACT_BREED_BONUS', 1.0),

        // Score for same species but different breed
        'same_species_score' => env('MATCHING_SAME_SPECIES_SCORE', 0.5),
    ],

];
