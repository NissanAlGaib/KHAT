<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionTier extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price',
        'features',
        'duration_days',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Convenience accessors for feature limits stored in the features JSON column.
     */
    public function getMaxPetsAttribute()
    {
        return $this->features['max_pets'] ?? null;
    }

    public function getMaxMatchesAttribute()
    {
        return $this->features['max_matches_per_month'] ?? null;
    }

    public function getMaxAiGenerationsAttribute()
    {
        return $this->features['max_ai_generations_per_day'] ?? null;
    }
}
