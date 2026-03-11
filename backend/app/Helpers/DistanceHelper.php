<?php

namespace App\Helpers;

class DistanceHelper
{
    /**
     * Format a distance value into a human-readable label based on both users' precision settings.
     *
     * @param float|null $distanceKm  calculated distance in km (may be null)
     * @param string     $viewerPrecision  the requesting user's location_precision ('city','barangay','exact')
     * @param string     $targetPrecision  the target user's location_precision ('city','barangay','exact')
     * @return array{distance_km: float|null, distance_label: string}
     */
    public static function format(?float $distanceKm, string $viewerPrecision = 'city', string $targetPrecision = 'city'): array
    {
        if (is_null($distanceKm)) {
            return [
                'distance_km' => null,
                'distance_label' => 'Location not available',
            ];
        }

        // Use the coarser of the two precisions to determine display granularity
        $effectivePrecision = self::coarsestPrecision($viewerPrecision, $targetPrecision);

        switch ($effectivePrecision) {
            case 'exact':
                // Show precise distance
                if ($distanceKm < 1) {
                    $meters = round($distanceKm * 1000);
                    return [
                        'distance_km' => round($distanceKm, 2),
                        'distance_label' => "{$meters}m away",
                    ];
                }
                return [
                    'distance_km' => round($distanceKm, 1),
                    'distance_label' => round($distanceKm, 1) . ' km away',
                ];

            case 'barangay':
                // Show approximate distance (round to nearest km)
                if ($distanceKm < 1) {
                    return [
                        'distance_km' => round($distanceKm, 1),
                        'distance_label' => 'Less than 1 km away',
                    ];
                }
                $rounded = round($distanceKm);
                return [
                    'distance_km' => (float) $rounded,
                    'distance_label' => "~{$rounded} km away",
                ];

            case 'city':
            default:
                // Show broad ranges only
                if ($distanceKm < 5) {
                    return [
                        'distance_km' => round($distanceKm, 0),
                        'distance_label' => 'Same area',
                    ];
                }
                if ($distanceKm < 20) {
                    return [
                        'distance_km' => round($distanceKm, 0),
                        'distance_label' => 'Nearby',
                    ];
                }
                if ($distanceKm < 50) {
                    return [
                        'distance_km' => round($distanceKm, 0),
                        'distance_label' => 'Same province',
                    ];
                }
                if ($distanceKm < 200) {
                    return [
                        'distance_km' => round($distanceKm, 0),
                        'distance_label' => 'Same region',
                    ];
                }
                return [
                    'distance_km' => round($distanceKm, 0),
                    'distance_label' => 'Far away',
                ];
        }
    }

    /**
     * Return the coarser of two precision levels.
     * Order: city (coarsest) > barangay > exact (finest)
     */
    private static function coarsestPrecision(string $a, string $b): string
    {
        $order = ['city' => 0, 'barangay' => 1, 'exact' => 2];
        $valA = $order[$a] ?? 0;
        $valB = $order[$b] ?? 0;
        $minVal = min($valA, $valB);

        return array_search($minVal, $order);
    }

    /**
     * Calculate Haversine distance between two lat/lng points.
     */
    public static function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
