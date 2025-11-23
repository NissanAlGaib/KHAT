<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerPreference extends Model
{
    protected $fillable = [
        'pet_id',
        'preferred_breed',
        'preferred_behaviors',
        'preferred_attributes',
        'min_age',
        'max_age',
        'preferred_sex',
    ];

    protected $casts = [
        'preferred_behaviors' => 'array',
        'preferred_attributes' => 'array',
        'min_age' => 'integer',
        'max_age' => 'integer',
    ];

    /**
     * Get the pet that owns the partner preferences
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet_id', 'pet_id');
    }
}
