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
 * Each pet has one card per vaccination type.
 * Protocol configuration is now sourced from the vaccine_protocols table (admin-managed).
 */
class VaccinationCard extends Model
{
    protected $primaryKey = 'card_id';

    /**
     * Status constants
     */
    const STATUS_NOT_STARTED = 'not_started';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'pet_id',
        'vaccine_protocol_id',
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
     * Get the vaccine protocol this card is based on
     */
    public function protocol(): BelongsTo
    {
        return $this->belongsTo(VaccineProtocol::class, 'vaccine_protocol_id');
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
     * Get approved shots for this card (only admin-approved count as complete)
     */
    public function approvedShots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->where('verification_status', 'approved')
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get approved series shots (non-booster, approved)
     */
    public function approvedSeriesShots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->where('verification_status', 'approved')
            ->where('is_booster', false)
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get approved booster shots
     */
    public function approvedBoosterShots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->where('verification_status', 'approved')
            ->where('is_booster', true)
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get pending shots (uploaded but awaiting admin review)
     */
    public function pendingShots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->where('verification_status', 'pending')
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get historical shots (pre-app records, bypass verification)
     */
    public function historicalShots(): HasMany
    {
        return $this->hasMany(VaccinationShot::class, 'card_id', 'card_id')
            ->where('verification_status', 'historical')
            ->orderBy('shot_number', 'asc');
    }

    /**
     * Get the latest approved shot
     */
    public function latestApprovedShot()
    {
        return $this->approvedShots()->latest('shot_number')->first();
    }

    /**
     * Get the latest shot (any status)
     */
    public function latestShot()
    {
        return $this->shots()->latest('shot_number')->first();
    }

    /**
     * Calculate progress percentage based on approved shots only
     */
    public function getProgressPercentageAttribute(): int
    {
        $protocol = $this->protocol;

        if ($protocol && $protocol->isPurelyRecurring()) {
            // For recurring vaccines, check if current shot is valid and approved
            $latestApproved = $this->latestApprovedShot();
            if ($latestApproved && $latestApproved->expiration_date >= now()) {
                return 100;
            }
            return $latestApproved ? 50 : 0;
        }

        // For series-based protocols
        $seriesDoses = $protocol ? $protocol->series_doses : $this->total_shots_required;
        if (!$seriesDoses) {
            return 0;
        }

        $approvedCount = $this->approvedSeriesShots()->count();
        return min(100, (int) (($approvedCount / $seriesDoses) * 100));
    }

    /**
     * Get the number of approved shots
     */
    public function getApprovedShotsCountAttribute(): int
    {
        return $this->approvedShots()->count();
    }

    /**
     * Get the number of pending shots
     */
    public function getPendingShotsCountAttribute(): int
    {
        return $this->pendingShots()->count();
    }

    /**
     * Check if series is complete (all required doses approved)
     */
    public function isSeriesComplete(): bool
    {
        $protocol = $this->protocol;

        if ($protocol && $protocol->isPurelyRecurring()) {
            // Recurring vaccines: check if current vaccination is valid and approved
            $latestApproved = $this->latestApprovedShot();
            return $latestApproved && $latestApproved->expiration_date >= now();
        }

        $seriesDoses = $protocol ? $protocol->series_doses : $this->total_shots_required;
        if (!$seriesDoses) {
            return false;
        }

        $approvedSeriesCount = $this->approvedSeriesShots()->count();

        if ($protocol && $protocol->has_booster) {
            // Series + booster: series is complete when all series doses are approved
            // AND latest booster (if any due) is also approved and valid
            if ($approvedSeriesCount >= $seriesDoses) {
                $latestBooster = $this->approvedBoosterShots()->latest('shot_number')->first();
                if ($latestBooster) {
                    return $latestBooster->expiration_date >= now();
                }
                // Series done, no booster yet — check if first booster is due
                $lastSeriesShot = $this->approvedSeriesShots()->latest('shot_number')->first();
                if ($lastSeriesShot && $lastSeriesShot->expiration_date >= now()) {
                    return true; // Still within the last series shot's validity
                }
                return false; // Booster is due
            }
            return false;
        }

        // Fixed series only: complete when all doses approved
        return $approvedSeriesCount >= $seriesDoses;
    }

    /**
     * Check if the card is currently in the booster phase
     * (series complete, now tracking recurring boosters)
     */
    public function isInBoosterPhase(): bool
    {
        $protocol = $this->protocol;
        if (!$protocol || !$protocol->has_booster || !$protocol->hasSeries()) {
            return false;
        }

        $seriesDoses = $protocol->series_doses;
        $approvedSeriesCount = $this->approvedSeriesShots()->count();

        return $approvedSeriesCount >= $seriesDoses;
    }

    /**
     * Calculate the next shot date based on the latest approved shot
     */
    public function calculateNextShotDate(): ?Carbon
    {
        $latestApproved = $this->latestApprovedShot();

        if (!$latestApproved) {
            return null;
        }

        $protocol = $this->protocol;

        // For protocols with booster after series completion
        if ($protocol && $protocol->has_booster && $this->isInBoosterPhase()) {
            return $latestApproved->expiration_date ? Carbon::parse($latestApproved->expiration_date) : null;
        }

        // For series: if series is complete and no booster needed, no next shot
        if ($protocol && $protocol->hasSeries() && !$protocol->has_booster) {
            $seriesDoses = $protocol->series_doses;
            if ($this->approvedSeriesShots()->count() >= $seriesDoses) {
                return null;
            }
        }

        // Next shot is due when the current shot expires
        return $latestApproved->expiration_date ? Carbon::parse($latestApproved->expiration_date) : null;
    }

    /**
     * Calculate expiration date for a new shot based on protocol
     */
    public function calculateNextExpirationDate(Carbon $shotDate, bool $isBooster = false): Carbon
    {
        $protocol = $this->protocol;

        if ($protocol) {
            if ($isBooster || $protocol->isPurelyRecurring()) {
                return $shotDate->copy()->addDays($protocol->booster_interval_days);
            }
            // Series dose
            return $shotDate->copy()->addDays($protocol->series_interval_days ?? 30);
        }

        // Fallback for cards without a protocol
        if ($this->recurrence_type === 'yearly') {
            return $shotDate->copy()->addYear();
        } elseif ($this->recurrence_type === 'biannual') {
            return $shotDate->copy()->addMonths(6);
        }

        return $shotDate->copy()->addDays($this->interval_days ?? 30);
    }

    /**
     * Determine the next shot number for a new upload
     */
    public function getNextShotNumber(): int
    {
        $latestShot = $this->latestShot();
        return $latestShot ? $latestShot->shot_number + 1 : 1;
    }

    /**
     * Determine if the next shot should be a booster
     */
    public function shouldNextShotBeBooster(): bool
    {
        return $this->isInBoosterPhase();
    }

    /**
     * Update card status based on approved shots
     */
    public function updateStatus(): void
    {
        $approvedCount = $this->approvedShots()->count();
        $latestApproved = $this->latestApprovedShot();

        if ($approvedCount === 0) {
            // Check if there are pending shots
            if ($this->pendingShots()->count() > 0) {
                $this->status = self::STATUS_IN_PROGRESS;
            } else {
                $this->status = self::STATUS_NOT_STARTED;
            }
        } elseif ($this->isSeriesComplete()) {
            $this->status = self::STATUS_COMPLETED;
        } elseif ($latestApproved && $latestApproved->expiration_date && Carbon::parse($latestApproved->expiration_date)->isPast()) {
            $this->status = self::STATUS_OVERDUE;
        } else {
            $this->status = self::STATUS_IN_PROGRESS;
        }

        $this->save();
    }

    /**
     * Create required vaccination cards for a pet based on active protocols for its species
     */
    public static function createRequiredCardsForPet(int $petId): array
    {
        $pet = Pet::findOrFail($petId);

        $protocols = VaccineProtocol::active()
            ->required()
            ->forSpecies($pet->species)
            ->ordered()
            ->get();

        $cards = [];

        foreach ($protocols as $protocol) {
            // Check if card already exists for this pet + protocol
            $existing = self::where('pet_id', $petId)
                ->where('vaccine_protocol_id', $protocol->id)
                ->first();

            if ($existing) {
                $cards[] = $existing;
                continue;
            }

            // Determine recurrence_type for backward compatibility
            $recurrenceType = 'none';
            if ($protocol->isPurelyRecurring()) {
                $recurrenceType = $protocol->booster_interval_days >= 365 ? 'yearly' : 'biannual';
            }

            $cards[] = self::create([
                'pet_id' => $petId,
                'vaccine_protocol_id' => $protocol->id,
                'vaccine_type' => $protocol->slug,
                'vaccine_name' => $protocol->name,
                'is_required' => true,
                'total_shots_required' => $protocol->series_doses,
                'interval_days' => $protocol->series_interval_days ?? $protocol->booster_interval_days,
                'recurrence_type' => $recurrenceType,
                'status' => self::STATUS_NOT_STARTED,
            ]);
        }

        return $cards;
    }

    /**
     * Create a card for an optional protocol (user opt-in)
     */
    public static function createFromProtocol(int $petId, VaccineProtocol $protocol): self
    {
        // Check if card already exists
        $existing = self::where('pet_id', $petId)
            ->where('vaccine_protocol_id', $protocol->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $recurrenceType = 'none';
        if ($protocol->isPurelyRecurring()) {
            $recurrenceType = $protocol->booster_interval_days >= 365 ? 'yearly' : 'biannual';
        }

        return self::create([
            'pet_id' => $petId,
            'vaccine_protocol_id' => $protocol->id,
            'vaccine_type' => $protocol->slug,
            'vaccine_name' => $protocol->name,
            'is_required' => $protocol->is_required,
            'total_shots_required' => $protocol->series_doses,
            'interval_days' => $protocol->series_interval_days ?? $protocol->booster_interval_days,
            'recurrence_type' => $recurrenceType,
            'status' => self::STATUS_NOT_STARTED,
        ]);
    }
}
