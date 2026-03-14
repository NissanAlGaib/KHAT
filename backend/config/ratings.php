<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rating Categories
    |--------------------------------------------------------------------------
    |
    | Define the rating categories for each review type. Each category has
    | a machine key and a human-readable label. Ratings use half-star
    | increments (0.5 – 5.0).
    |
    */

    'breeder_categories' => [
        'communication'       => 'Communication & Responsiveness',
        'pet_handling'        => 'Pet Handling & Care',
        'reliability'         => 'Reliability & Punctuality',
        'contract_compliance' => 'Contract Compliance',
        'overall_experience'  => 'Overall Experience',
    ],

    'shooter_categories' => [
        'professionalism'     => 'Professionalism',
        'pet_handling_skills' => 'Pet Handling Skills',
        'communication'       => 'Communication',
        'timeliness'          => 'Timeliness',
        'overall_satisfaction' => 'Overall Satisfaction',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rating Constraints
    |--------------------------------------------------------------------------
    */

    'min_rating' => 0.5,
    'max_rating' => 5.0,
    'step'       => 0.5,

];
