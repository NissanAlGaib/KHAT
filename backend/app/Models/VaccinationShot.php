<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * VaccinationShot Model
 * 
 * Represents an individual vaccination shot within a vaccination card.
 * Shots are ADD-ONLY - they are never edited or deleted once created.
 * Each shot has proof documentation required.
 */
class VaccinationShot extends Model
{
    protected $primaryKey = 'shot_id';

    /**
     * Status constants
     */
    const STATUS_COMPLETED = 'completed';
    const STATUS_PENDING = 'pending';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_VERIFIED = 'verified';

    /**
     * Verification status constants
     */
    const VERIFICATION_PENDING = 'pending';
    const VERIFICATION_APPROVED = 'approved';
    const VERIFICATION_REJECTED = 'rejected';
    const VERIFICATION_HISTORICAL = 'historical'; // Pre-app records, no verification needed

    protected $fillable = [
        'card_id',
        'shot_number',
        'vaccination_record',
        'clinic_name',
        'veterinarian_name',
        'date_administered',
        'expiration_date',
        'next_shot_date',
        'status',
        'verification_status',
        'is_historical',
        'rejection_reason',
    ];

    protected $casts = [
        'shot_number' => 'integer',
        'date_administered' => 'date',
        'expiration_date' => 'date',
        'next_shot_date' => 'date',
        'is_historical' => 'boolean',
    ];

    /**
     * Get the vaccination card this shot belongs to
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(VaccinationCard::class, 'card_id', 'card_id');
    }

    /**
     * Get the pet through the card relationship
     */
    public function pet()
    {
        return $this->card?->pet;
    }

    /**
     * Check if this shot is expired
     */
    public function isExpired(): bool
    {
        return $this->expiration_date < now();
    }

    /**
     * Check if this shot is expiring soon (within 30 days)
     */
    public function isExpiringSoon(): bool
    {
        $expirationDate = Carbon::parse($this->expiration_date);
        $daysUntilExpiration = now()->diffInDays($expirationDate, false);
        return $daysUntilExpiration >= 0 && $daysUntilExpiration <= 30;
    }

    /**
     * Get the display status for UI
     */
    public function getDisplayStatusAttribute(): string
    {
        // Historical records always show as "historical" regardless of expiration
        if ($this->verification_status === self::VERIFICATION_HISTORICAL || $this->is_historical) {
            return 'historical';
        }

        if ($this->verification_status === self::VERIFICATION_REJECTED) {
            return 'rejected';
        }

        if ($this->isExpired()) {
            return 'expired';
        }

        if ($this->status === self::STATUS_PENDING) {
            if ($this->next_shot_date && Carbon::parse($this->next_shot_date)->isPast()) {
                return 'overdue';
            }
            return 'pending';
        }

        if ($this->verification_status === self::VERIFICATION_APPROVED) {
            return 'verified';
        }

        return $this->status;
    }

    /**
     * Create a new shot for a vaccination card
     * Automatically calculates shot number and dates
     * Next shot date is based on when this shot expires (user-provided expiration)
     * 
     * @param VaccinationCard $card
     * @param string $documentPath
     * @param string $clinicName
     * @param string $veterinarianName
     * @param string $dateAdministered
     * @param string $expirationDate
     * @param int|null $shotNumber Optional shot number (for historical records)
     */
    public static function createForCard(
        VaccinationCard $card,
        string $documentPath,
        string $clinicName,
        string $veterinarianName,
        string $dateAdministered,
        string $expirationDate,
        ?int $shotNumber = null
    ): self {
        // Use provided shot number or auto-calculate
        if ($shotNumber !== null) {
            $nextShotNumber = $shotNumber;
        } else {
            $latestShot = $card->latestShot();
            $nextShotNumber = $latestShot ? $latestShot->shot_number + 1 : 1;
        }

        // Calculate next shot date based on expiration
        // Next shot is due when this shot expires
        $nextShotDate = null;
        
        // Determine if more shots will be needed
        $willNeedMore = true;
        
        // For non-recurring vaccines with a fixed series (e.g., Parvo 6-shot)
        // No next shot after series is complete
        if ($card->recurrence_type === 'none' && $card->total_shots_required) {
            if ($nextShotNumber >= $card->total_shots_required) {
                $willNeedMore = false;
            }
        }
        
        // For recurring vaccines (yearly, biannual) or incomplete series,
        // next shot is due when this one expires
        if ($willNeedMore) {
            $nextShotDate = Carbon::parse($expirationDate);
        }

        $shot = self::create([
            'card_id' => $card->card_id,
            'shot_number' => $nextShotNumber,
            'vaccination_record' => $documentPath,
            'clinic_name' => $clinicName,
            'veterinarian_name' => $veterinarianName,
            'date_administered' => $dateAdministered,
            'expiration_date' => $expirationDate,
            'next_shot_date' => $nextShotDate,
            'status' => self::STATUS_COMPLETED,
            'verification_status' => self::VERIFICATION_PENDING,
        ]);

        // Update the card status
        $card->updateStatus();

        return $shot;
    }

    /**
     * Create a historical shot for a vaccination card
     * Historical shots bypass the verification queue and are marked accordingly
     * 
     * @param VaccinationCard $card
     * @param string $documentPath
     * @param string $clinicName
     * @param string $veterinarianName
     * @param string $dateAdministered
     * @param string $expirationDate
     * @param int $shotNumber Required for historical shots
     */
    public static function createHistoricalShot(
        VaccinationCard $card,
        string $documentPath,
        string $clinicName,
        string $veterinarianName,
        string $dateAdministered,
        string $expirationDate,
        int $shotNumber
    ): self {
        // Calculate next shot date based on expiration
        $nextShotDate = null;
        
        // Determine if more shots will be needed
        $willNeedMore = true;
        
        // For non-recurring vaccines with a fixed series
        if ($card->recurrence_type === 'none' && $card->total_shots_required) {
            if ($shotNumber >= $card->total_shots_required) {
                $willNeedMore = false;
            }
        }
        
        // For recurring vaccines or incomplete series
        if ($willNeedMore) {
            $nextShotDate = Carbon::parse($expirationDate);
        }

        $shot = self::create([
            'card_id' => $card->card_id,
            'shot_number' => $shotNumber,
            'vaccination_record' => $documentPath,
            'clinic_name' => $clinicName,
            'veterinarian_name' => $veterinarianName,
            'date_administered' => $dateAdministered,
            'expiration_date' => $expirationDate,
            'next_shot_date' => $nextShotDate,
            'status' => self::STATUS_COMPLETED,
            'verification_status' => self::VERIFICATION_HISTORICAL,
            'is_historical' => true,
        ]);

        // Update the card status
        $card->updateStatus();

        return $shot;
    }

    /**
     * Format shot for API response
     */
    public function toApiArray(): array
    {
        return [
            'shot_id' => $this->shot_id,
            'shot_number' => $this->shot_number,
            'vaccination_record' => $this->vaccination_record,
            'clinic_name' => $this->clinic_name,
            'veterinarian_name' => $this->veterinarian_name,
            'date_administered' => $this->date_administered?->format('Y-m-d'),
            'date_administered_display' => $this->date_administered?->format('M j, Y'),
            'expiration_date' => $this->expiration_date?->format('Y-m-d'),
            'expiration_date_display' => $this->expiration_date?->format('M j, Y'),
            'next_shot_date' => $this->next_shot_date?->format('Y-m-d'),
            'next_shot_date_display' => $this->next_shot_date?->format('M j, Y'),
            'status' => $this->status,
            'verification_status' => $this->verification_status,
            'display_status' => $this->display_status,
            'rejection_reason' => $this->rejection_reason,
            'is_expired' => $this->isExpired(),
            'is_expiring_soon' => $this->isExpiringSoon(),
            'is_historical' => (bool) $this->is_historical,
        ];
    }
}
