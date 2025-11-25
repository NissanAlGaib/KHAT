<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pet extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'pet_id';

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
}
