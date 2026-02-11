<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * VaccineProtocol Model
 * 
 * Admin-managed vaccine protocol definitions.
 * Supports three protocol types:
 * - Fixed series only: series_doses set, has_booster=false
 * - Series + booster: series_doses set, has_booster=true with booster_interval_days
 * - Purely recurring: series_doses=null, has_booster=true with booster_interval_days
 */
class VaccineProtocol extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'species',
        'is_required',
        'description',
        'series_doses',
        'series_interval_days',
        'has_booster',
        'booster_interval_days',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'series_doses' => 'integer',
        'series_interval_days' => 'integer',
        'has_booster' => 'boolean',
        'booster_interval_days' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Protocol type constants for display
     */
    const TYPE_SERIES_ONLY = 'series_only';
    const TYPE_SERIES_WITH_BOOSTER = 'series_with_booster';
    const TYPE_RECURRING = 'recurring';

    /**
     * Get all vaccination cards using this protocol
     */
    public function vaccinationCards(): HasMany
    {
        return $this->hasMany(VaccinationCard::class, 'vaccine_protocol_id');
    }

    /**
     * Scope: only active protocols
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: protocols for a given species (includes 'all')
     */
    public function scopeForSpecies(Builder $query, string $species): Builder
    {
        return $query->where(function ($q) use ($species) {
            $q->whereRaw('LOWER(species) = ?', [strtolower($species)])
              ->orWhere('species', 'all');
        });
    }

    /**
     * Scope: required protocols only
     */
    public function scopeRequired(Builder $query): Builder
    {
        return $query->where('is_required', true);
    }

    /**
     * Scope: optional protocols only
     */
    public function scopeOptional(Builder $query): Builder
    {
        return $query->where('is_required', false);
    }

    /**
     * Scope: ordered by sort_order then name
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Determine the protocol type
     */
    public function getProtocolTypeAttribute(): string
    {
        if ($this->series_doses && $this->has_booster) {
            return self::TYPE_SERIES_WITH_BOOSTER;
        }

        if ($this->series_doses && !$this->has_booster) {
            return self::TYPE_SERIES_ONLY;
        }

        return self::TYPE_RECURRING;
    }

    /**
     * Get human-readable protocol type label
     */
    public function getProtocolTypeLabelAttribute(): string
    {
        return match ($this->protocol_type) {
            self::TYPE_SERIES_ONLY => "{$this->series_doses}-dose series",
            self::TYPE_SERIES_WITH_BOOSTER => "{$this->series_doses}-dose series + booster every " . $this->formatIntervalDays($this->booster_interval_days),
            self::TYPE_RECURRING => "Recurring every " . $this->formatIntervalDays($this->booster_interval_days),
        };
    }

    /**
     * Get the total number of shots in the initial series
     * Returns null for purely recurring protocols
     */
    public function getSeriesDoseCountAttribute(): ?int
    {
        return $this->series_doses;
    }

    /**
     * Check if this protocol has a fixed-dose initial series
     */
    public function hasSeries(): bool
    {
        return $this->series_doses !== null && $this->series_doses > 0;
    }

    /**
     * Check if this protocol is purely recurring (no initial series)
     */
    public function isPurelyRecurring(): bool
    {
        return !$this->hasSeries() && $this->has_booster;
    }

    /**
     * Format interval days to human-readable string
     */
    private function formatIntervalDays(?int $days): string
    {
        if (!$days) {
            return 'N/A';
        }

        if ($days >= 365) {
            $years = intdiv($days, 365);
            return $years === 1 ? 'year' : "{$years} years";
        }

        if ($days >= 30) {
            $months = intdiv($days, 30);
            return $months === 1 ? 'month' : "{$months} months";
        }

        return "{$days} days";
    }

    /**
     * Generate a unique slug from the name
     */
    public static function generateSlug(string $name): string
    {
        $slug = strtolower(str_replace([' ', '(', ')', '-'], ['_', '', '', '_'], $name));
        $slug = preg_replace('/[^a-z0-9_]/', '', $slug);
        $slug = preg_replace('/_+/', '_', trim($slug, '_'));

        // Ensure uniqueness
        $originalSlug = $slug;
        $counter = 1;
        while (self::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '_' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Format protocol for API response
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'species' => $this->species,
            'is_required' => $this->is_required,
            'description' => $this->description,
            'series_doses' => $this->series_doses,
            'series_interval_days' => $this->series_interval_days,
            'has_booster' => $this->has_booster,
            'booster_interval_days' => $this->booster_interval_days,
            'protocol_type' => $this->protocol_type,
            'protocol_type_label' => $this->protocol_type_label,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
        ];
    }
}
