<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Litter extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'litter_id';

    protected $fillable = [
        'contract_id',
        'sire_id',
        'dam_id',
        'sire_owner_id',
        'dam_owner_id',
        'birth_date',
        'total_offspring',
        'alive_offspring',
        'died_offspring',
        'male_count',
        'female_count',
        'status',
        'notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'total_offspring' => 'integer',
        'alive_offspring' => 'integer',
        'died_offspring' => 'integer',
        'male_count' => 'integer',
        'female_count' => 'integer',
    ];

    /**
     * Get the sire (male parent) of the litter
     */
    public function sire(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'sire_id', 'pet_id');
    }

    /**
     * Get the dam (female parent) of the litter
     */
    public function dam(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'dam_id', 'pet_id');
    }

    /**
     * Get the owner of the sire
     */
    public function sireOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sire_owner_id');
    }

    /**
     * Get the owner of the dam
     */
    public function damOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dam_owner_id');
    }

    /**
     * Get the offspring of the litter
     */
    public function offspring(): HasMany
    {
        return $this->hasMany(LitterOffspring::class, 'litter_id', 'litter_id');
    }

    /**
     * Get the breeding contract this litter belongs to
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(BreedingContract::class, 'contract_id');
    }

    /**
     * Get the litter's age in months
     */
    public function getAgeInMonthsAttribute(): int
    {
        return $this->birth_date->diffInMonths(now());
    }

    /**
     * Get formatted litter title
     */
    public function getTitleAttribute(): string
    {
        return $this->sire->name . ' & ' . $this->dam->name;
    }
}
