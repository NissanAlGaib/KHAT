<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

/**
 * VaccinationCard Model
 * 
 * Represents a vaccination type card for a pet.
 * Each pet has one card per vaccination type (Parvo, Distemper, Rabies, Leptospirosis, etc.)
 * Contains the configuration and tracks overall progress for that vaccine type.
 */
class VaccinationCard extends Model
{
    protected $primaryKey = 'card_id';

    /**
     * Required vaccination types with their configurations
     */
    const REQUIRED_VACCINES = [
        'parvo' => [
            'name' => 'Parvovirus (5-in-1)',
            'total_shots' => 6,
            'interval_days' => 21, // 3 weeks between shots
            'recurrence_type' => 'none',
        ],
        'distemper' => [
            'name' => 'Distemper',
            'total_shots' => 6,
            'interval_days' => 21, // 3 weeks between shots
            'recurrence_type' => 'none',
        ],
        'rabies' => [
            'name' => 'Anti-Rabies',
            'total_shots' => null, // Recurring
            'interval_days' => 365, // 1 year
            'recurrence_type' => 'yearly',
        ],
        'leptospirosis' => [
            'name' => 'Leptospirosis',
            'total_shots' => null, // Recurring
            'interval_days' => 180, // 6 months
            'recurrence_type' => 'biannual',
        ],
    ];

    /**
     * Status constants
     */
    const STATUS_NOT_STARTED = 'not_started';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'pet_id',
        'vaccine_type',
        'vaccine_name',
        'is_required',
        'total_shots_required',
        'interval_days',
        'recurrence_type',
        'status',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'total_shots_required' => 'integer',
        'interval_days' => 'integer',
    ];

    /**
     * Get the pet that owns this vaccination card
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet_id', 'pet_id');
    }

    /**
     * Get all shots for this vaccination card
     */
    public function shots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get completed shots for this card
     */
    public function completedShots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->whereIn('status', ['completed', 'verified'])
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get the latest shot
     */
    public function latestShot()
    {
        return $this->shots()->latest('shot_number')->first();
    }

    /**
     * Get the next pending shot (if any)
     */
    public function pendingShot()
    {
        return $this->shots()->where('status', 'pending')->first();
    }

    /**
     * Calculate progress percentage
     */
    public function getProgressPercentageAttribute(): int
    {
        if (!$this->total_shots_required) {
            // For recurring vaccines, check if current shot is valid
            $latestShot = $this->latestShot();
            if ($latestShot && $latestShot->expiration_date >= now()) {
                return 100;
            }
            return $latestShot ? 50 : 0;
        }

        $completedCount = $this->completedShots()->count();
        return min(100, (int) (($completedCount / $this->total_shots_required) * 100));
    }

    /**
     * Get the number of completed shots
     */
    public function getCompletedShotsCountAttribute(): int
    {
        return $this->completedShots()->count();
    }

    /**
     * Check if series is complete
     */
    public function isSeriesComplete(): bool
    {
        if (!$this->total_shots_required) {
            // Recurring vaccines - check if current vaccination is valid
            $latestShot = $this->latestShot();
            return $latestShot && $latestShot->expiration_date >= now();
        }

        return $this->completedShots()->count() >= $this->total_shots_required;
    }

    /**
     * Calculate the next shot date based on the latest shot's expiration
     * Returns the expiration date of the most recent shot (when next shot is due)
     */
    public function calculateNextShotDate(): ?Carbon
    {
        $latestShot = $this->latestShot();
        
        if (!$latestShot) {
            return null;
        }

        // For non-recurring vaccines with completed series, no next shot needed
        if ($this->recurrence_type === 'none' && $this->total_shots_required) {
            if ($this->completedShots()->count() >= $this->total_shots_required) {
                return null;
            }
        }

        // Next shot is due when the current shot expires
        return $latestShot->expiration_date ? Carbon::parse($latestShot->expiration_date) : null;
    }

    /**
     * Calculate the next expiration date
     */
    public function calculateNextExpirationDate(Carbon $shotDate): Carbon
    {
        if ($this->recurrence_type === 'yearly') {
            return $shotDate->copy()->addYear();
        } elseif ($this->recurrence_type === 'biannual') {
            return $shotDate->copy()->addMonths(6);
        } else {
            // For multi-shot series, expiration is typically after the series completes
            // Use the interval + buffer for individual shots
            return $shotDate->copy()->addDays($this->interval_days ?? 30);
        }
    }

    /**
     * Update card status based on shots
     */
    public function updateStatus(): void
    {
        $completedCount = $this->completedShots()->count();
        $latestShot = $this->latestShot();

        if ($completedCount === 0) {
            $this->status = self::STATUS_NOT_STARTED;
        } elseif ($this->isSeriesComplete()) {
            $this->status = self::STATUS_COMPLETED;
        } elseif ($latestShot && $latestShot->next_shot_date && Carbon::parse($latestShot->next_shot_date)->isPast()) {
            $this->status = self::STATUS_OVERDUE;
        } else {
            $this->status = self::STATUS_IN_PROGRESS;
        }

        $this->save();
    }

    /**
     * Create required vaccination cards for a pet
     */
    public static function createRequiredCardsForPet(int $petId): array
    {
        $cards = [];

        foreach (self::REQUIRED_VACCINES as $type => $config) {
            $cards[] = self::create([
                'pet_id' => $petId,
                'vaccine_type' => $type,
                'vaccine_name' => $config['name'],
                'is_required' => true,
                'total_shots_required' => $config['total_shots'],
                'interval_days' => $config['interval_days'],
                'recurrence_type' => $config['recurrence_type'],
                'status' => self::STATUS_NOT_STARTED,
            ]);
        }

        return $cards;
    }

    /**
     * Create a custom (optional) vaccination card for a pet
     */
    public static function createCustomCard(
        int $petId,
        string $vaccineName,
        ?int $totalShots = 1,
        string $recurrenceType = 'none'
    ): self {
        $type = 'custom_' . strtolower(str_replace(' ', '_', $vaccineName)) . '_' . time();

        return self::create([
            'pet_id' => $petId,
            'vaccine_type' => $type,
            'vaccine_name' => $vaccineName,
            'is_required' => false,
            'total_shots_required' => $totalShots,
            'interval_days' => null, // No longer used for scheduling - expiration date determines next shot
            'recurrence_type' => $recurrenceType,
            'status' => self::STATUS_NOT_STARTED,
        ]);
    }
}
