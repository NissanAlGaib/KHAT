<?php

namespace App\Helpers;

class SubscriptionTierHelper
{
    /**
     * Normalize tier keys so legacy values still map to current config keys.
     */
    public static function normalize(?string $tier): string
    {
        $normalized = strtolower(trim((string) $tier));

        if ($normalized === '' || $normalized === 'null') {
            return 'free';
        }

        // Legacy plan key still used by some older records and endpoints.
        if ($normalized === 'standard') {
            return 'basic';
        }

        return $normalized;
    }

    /**
     * Convert internal tier value to legacy/public naming when needed.
     */
    public static function toLegacy(?string $tier): string
    {
        $normalized = self::normalize($tier);

        return $normalized === 'basic' ? 'standard' : $normalized;
    }

    /**
     * Get feature limits from subscription config with legacy key fallback.
     */
    public static function getFeatureLimit(?string $tier, string $feature, $default = null)
    {
        $normalizedTier = self::normalize($tier);

        $features = config("subscription.tiers.{$normalizedTier}.features");
        if (is_array($features) && array_key_exists($feature, $features)) {
            return $features[$feature];
        }

        $rawTier = strtolower(trim((string) $tier));
        if ($rawTier !== '' && $rawTier !== $normalizedTier) {
            $rawFeatures = config("subscription.tiers.{$rawTier}.features");
            if (is_array($rawFeatures) && array_key_exists($feature, $rawFeatures)) {
                return $rawFeatures[$feature];
            }
        }

        return $default;
    }

    public static function isFreeTier(?string $tier): bool
    {
        return self::normalize($tier) === 'free';
    }
}
