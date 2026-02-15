<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;

class SubscriptionTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = config('subscription.tiers');

        foreach ($tiers as $slug => $tier) {
            SubscriptionTier::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $tier['name'],
                    'price' => $tier['price'],
                    'features' => $tier['features'],
                    'duration_days' => 30, // Default to 30 days
                    'is_active' => true,
                ]
            );
        }
    }
}
