<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vaccination extends Model
{
    protected $primaryKey = 'vaccination_id';

    protected $fillable = [
        'pet_id',
        'vaccine_name',
        'vaccination_record',
        'clinic_name',
        'veterinarian_name',
        'given_date',
        'expiration_date',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'given_date' => 'date',
        'expiration_date' => 'date',
    ];

    /**
     * Get the pet that owns the vaccination record
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet_id', 'pet_id');
    }
}
