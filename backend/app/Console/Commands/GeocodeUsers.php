<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GeocodeUsers extends Command
{
    protected $signature = 'users:geocode {--force : Overwrite existing coordinates}';

    protected $description = 'Backfill user coordinates from their address using Philippine city coordinates data';

    public function handle(): int
    {
        $coordsPath = database_path('data/philippine_city_coordinates.json');

        if (!file_exists($coordsPath)) {
            $this->error('City coordinates file not found at: ' . $coordsPath);
            return self::FAILURE;
        }

        $coordsData = json_decode(file_get_contents($coordsPath), true);
        if (!$coordsData) {
            $this->error('Failed to parse city coordinates JSON.');
            return self::FAILURE;
        }

        // Build a flat lookup: city name (lowercase) => {lat, lng}
        $lookup = $this->buildCityLookup($coordsData);

        $query = User::query();
        if (!$this->option('force')) {
            $query->whereNull('latitude');
        }

        $users = $query->whereNotNull('address')->get();
        $this->info("Processing {$users->count()} users...");

        $updated = 0;
        $skipped = 0;

        foreach ($users as $user) {
            $address = $user->address;

            // Address is cast as array in the model
            if (is_string($address)) {
                $address = json_decode($address, true);
            }

            if (!is_array($address)) {
                $skipped++;
                continue;
            }

            // Try to extract city from address data
            $city = $address['city'] ?? $address['municipality'] ?? null;

            if (!$city) {
                $skipped++;
                continue;
            }

            $cityKey = strtolower(trim($city));
            $coords = $lookup[$cityKey] ?? null;

            // Try partial match if exact match fails
            if (!$coords) {
                $coords = $this->fuzzyLookup($cityKey, $lookup);
            }

            if ($coords) {
                $user->update([
                    'latitude' => $coords['lat'],
                    'longitude' => $coords['lng'],
                    'location_precision' => 'city', // Geocoded from address = city-level
                ]);
                $updated++;
            } else {
                $this->warn("No coordinates found for city: {$city} (user #{$user->id})");
                $skipped++;
            }
        }

        $this->info("Done. Updated: {$updated}, Skipped: {$skipped}");
        return self::SUCCESS;
    }

    /**
     * Build a flat city name => coordinates lookup from the nested JSON structure.
     */
    private function buildCityLookup(array $data): array
    {
        $lookup = [];

        foreach ($data as $region => $provinces) {
            foreach ($provinces as $province => $cities) {
                foreach ($cities as $cityName => $coords) {
                    $key = strtolower(trim($cityName));
                    $lookup[$key] = $coords;

                    // Also store without "City" suffix for matching
                    $withoutCity = preg_replace('/\s+city$/i', '', $key);
                    if ($withoutCity !== $key) {
                        $lookup[$withoutCity] = $coords;
                    }
                }
            }
        }

        return $lookup;
    }

    /**
     * Simple fuzzy lookup: check if the city name is contained within any known city key.
     */
    private function fuzzyLookup(string $cityKey, array $lookup): ?array
    {
        foreach ($lookup as $key => $coords) {
            if (str_contains($key, $cityKey) || str_contains($cityKey, $key)) {
                return $coords;
            }
        }
        return null;
    }
}
