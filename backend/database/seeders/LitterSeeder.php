<?php

namespace Database\Seeders;

use App\Models\Litter;
use App\Models\LitterOffspring;
use App\Models\Pet;
use Illuminate\Database\Seeder;

class LitterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find existing pets to create litters for
        // You should have at least one male and one female pet in your database

        $malePets = Pet::where('sex', 'male')->where('status', 'active')->get();
        $femalePets = Pet::where('sex', 'female')->where('status', 'active')->get();

        if ($malePets->isEmpty() || $femalePets->isEmpty()) {
            $this->command->info('No suitable pets found. Please create at least one male and one female pet first.');
            return;
        }

        // Create sample litter
        $malePet = $malePets->first();
        $femalePet = $femalePets->first();

        $litter = Litter::create([
            'sire_id' => $malePet->pet_id,
            'dam_id' => $femalePet->pet_id,
            'sire_owner_id' => $malePet->user_id,
            'dam_owner_id' => $femalePet->user_id,
            'birth_date' => now()->subMonths(3), // 3 months ago
            'total_offspring' => 4,
            'alive_offspring' => 4,
            'died_offspring' => 0,
            'male_count' => 2,
            'female_count' => 2,
            'status' => 'active',
            'notes' => 'Healthy litter, all puppies doing well.',
        ]);

        // Create offspring records
        $offspringData = [
            [
                'name' => null, // Placeholder
                'sex' => 'male',
                'color' => 'brown',
                'status' => 'alive',
            ],
            [
                'name' => null,
                'sex' => 'male',
                'color' => 'black',
                'status' => 'alive',
            ],
            [
                'name' => null,
                'sex' => 'female',
                'color' => 'brown',
                'status' => 'alive',
            ],
            [
                'name' => null,
                'sex' => 'female',
                'color' => 'black',
                'status' => 'alive',
            ],
        ];

        foreach ($offspringData as $offspring) {
            LitterOffspring::create([
                'litter_id' => $litter->litter_id,
                'name' => $offspring['name'],
                'sex' => $offspring['sex'],
                'color' => $offspring['color'],
                'status' => $offspring['status'],
            ]);
        }

        $this->command->info('Sample litter created successfully!');
    }
}
