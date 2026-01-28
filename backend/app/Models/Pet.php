<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Pet extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'pet_id';

    /**
     * Default cooldown period in days after successful breeding
     */
    const DEFAULT_COOLDOWN_DAYS = 90; // 3 months

    /**
     * Pet status constants
     */
    const STATUS_PENDING_VERIFICATION = 'pending_verification';
    const STATUS_ACTIVE = 'active';
    const STATUS_DISABLED = 'disabled';
    const STATUS_REJECTED = 'rejected';

    /**
     * All available pet statuses
     */
    const STATUSES = [
        self::STATUS_PENDING_VERIFICATION,
        self::STATUS_ACTIVE,
        self::STATUS_DISABLED,
        self::STATUS_REJECTED,
    ];

    protected $fillable = [
        'user_id',
        'rec_id',
        'name',
        'species',
        'breed',
        'sex',
        'birthdate',
        'microchip_id',
        'height',
        'weight',
        'status',
        'description',
        'has_been_bred',
        'breeding_count',
        'cooldown_until',
        'behaviors',
        'attributes',
        'profile_image',
        'date_added',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'date_added' => 'datetime',
        'has_been_bred' => 'boolean',
        'breeding_count' => 'integer',
        'cooldown_until' => 'datetime',
        'height' => 'decimal:2',
        'weight' => 'decimal:2',
        'behaviors' => 'array',
        'attributes' => 'array',
    ];

    /**
     * Get the owner of the pet
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the recommender of the pet
     */
    public function recommender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rec_id');
    }

    /**
     * Get the photos for the pet
     */
    public function photos(): HasMany
    {
        return $this->hasMany(PetPhoto::class, 'pet_id', 'pet_id');
    }

    /**
     * Get the vaccinations for the pet
     */
    public function vaccinations(): HasMany
    {
        return $this->hasMany(Vaccination::class, 'pet_id', 'pet_id');
    }

    /**
     * Get the health records for the pet
     */
    public function healthRecords(): HasMany
    {
        return $this->hasMany(HealthRecord::class, 'pet_id', 'pet_id');
    }

    /**
     * Get the partner preferences for the pet
     */
    public function partnerPreferences(): HasMany
    {
        return $this->hasMany(PartnerPreference::class, 'pet_id', 'pet_id');
    }

    /**
     * Get match requests sent by this pet
     */
    public function sentMatchRequests(): HasMany
    {
        return $this->hasMany(MatchRequest::class, 'requester_pet_id', 'pet_id');
    }

    /**
     * Get match requests received by this pet
     */
    public function receivedMatchRequests(): HasMany
    {
        return $this->hasMany(MatchRequest::class, 'target_pet_id', 'pet_id');
    }

    /**
     * Get litters where this pet is the sire (male parent)
     */
    public function littersAsSire(): HasMany
    {
        return $this->hasMany(Litter::class, 'sire_id', 'pet_id');
    }

    /**
     * Get litters where this pet is the dam (female parent)
     */
    public function littersAsDam(): HasMany
    {
        return $this->hasMany(Litter::class, 'dam_id', 'pet_id');
    }

    /**
     * Get all litters this pet is a parent of
     */
    public function litters()
    {
        return $this->sex === 'male'
            ? $this->littersAsSire()
            : $this->littersAsDam();
    }

    /**
     * Get offspring record if this pet is an offspring
     */
    public function offspringRecord(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(LitterOffspring::class, 'pet_id', 'pet_id');
    }

    /**
     * Get the pet's age
     */
    public function getAgeAttribute(): string
    {
        $birthdate = $this->birthdate;
        $now = now();

        $years = $birthdate->diffInYears($now);
        $months = $birthdate->diffInMonths($now) % 12;

        if ($years > 0) {
            return $years . ' Year' . ($years > 1 ? 's' : '') . ' old';
        } else {
            return $months . ' Month' . ($months > 1 ? 's' : '') . ' old';
        }
    }

    /**
     * Check if the pet is currently on cooldown
     */
    public function isOnCooldown(): bool
    {
        if (!$this->cooldown_until) {
            return false;
        }

        return Carbon::now()->isBefore($this->cooldown_until);
    }

    /**
     * Get the remaining cooldown days
     */
    public function getCooldownDaysRemainingAttribute(): ?int
    {
        if (!$this->cooldown_until || !$this->isOnCooldown()) {
            return null;
        }

        return Carbon::now()->diffInDays($this->cooldown_until);
    }

    /**
     * Start cooldown period for the pet
     * @param int|null $days Number of days for cooldown, defaults to DEFAULT_COOLDOWN_DAYS
     */
    public function startCooldown(?int $days = null): void
    {
        $cooldownDays = $days ?? self::DEFAULT_COOLDOWN_DAYS;
        $this->cooldown_until = Carbon::now()->addDays($cooldownDays);
        $this->save();
    }

    /**
     * Clear the cooldown period for the pet
     */
    public function clearCooldown(): void
    {
        $this->cooldown_until = null;
        $this->save();
    }

    /**
     * Check if the pet is available for matching
     * Pet must be active and not on cooldown
     */
    public function isAvailableForMatching(): bool
    {
        return $this->status === 'active' && !$this->isOnCooldown();
    }

    /**
     * Scope for pets that are available for matching
     */
    public function scopeAvailableForMatching($query)
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('cooldown_until')
                    ->orWhere('cooldown_until', '<=', Carbon::now());
            });
    }

    /**
     * Scope for pets that are on cooldown
     */
    public function scopeOnCooldown($query)
    {
        return $query->where('cooldown_until', '>', Carbon::now());
    }

    /**
     * Get the primary photo URL for the pet.
     * Returns the primary photo if set, otherwise the first photo, otherwise null.
     *
     * @return string|null
     */
    public function getPrimaryPhotoUrlAttribute(): ?string
    {
        $primaryPhoto = $this->photos->firstWhere('is_primary', true);

        if ($primaryPhoto) {
            return $primaryPhoto->photo_url;
        }

        $firstPhoto = $this->photos->first();

        return $firstPhoto?->photo_url;
    }
}
