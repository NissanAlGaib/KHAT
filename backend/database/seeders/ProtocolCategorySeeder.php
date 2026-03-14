<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\ProtocolCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProtocolCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Core',
                'description' => 'Essential vaccines required for all pets based on severity of disease, risk of transmission, and potential for zoonosis (e.g., Rabies, DHPP).',
            ],
            [
                'name' => 'Non-Core',
                'description' => "Optional vaccines based on the pet's lifestyle, geographic location, and risk of exposure (e.g., Bordetella, Leptospirosis).",
            ],
        ];

        foreach ($categories as $category) {
            ProtocolCategory::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                ]
            );
        }
    }
}
