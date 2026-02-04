<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Subscription Prices
    |--------------------------------------------------------------------------
    |
    | These values define the pricing for subscription tiers.
    | Prices are in PHP (Philippine Peso).
    |
    */

    'prices' => [
        'basic' => env('SUBSCRIPTION_PRICE_BASIC', 199),
        'premium' => env('SUBSCRIPTION_PRICE_PREMIUM', 499),
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscription Tiers
    |--------------------------------------------------------------------------
    |
    | Configuration for each subscription tier including features and limits.
    |
    */

    'tiers' => [
        'free' => [
            'name' => 'Free',
            'price' => 0,
            'features' => [
                'max_pets' => 1,
                'max_matches_per_month' => 3,
            ],
        ],
        'basic' => [
            'name' => 'Basic',
            'price' => env('SUBSCRIPTION_PRICE_BASIC', 199),
            'features' => [
                'max_pets' => 5,
                'max_matches_per_month' => 20,
            ],
        ],
        'premium' => [
            'name' => 'Premium',
            'price' => env('SUBSCRIPTION_PRICE_PREMIUM', 499),
            'features' => [
                'max_pets' => null, // unlimited
                'max_matches_per_month' => null, // unlimited
            ],
        ],
    ],

];
