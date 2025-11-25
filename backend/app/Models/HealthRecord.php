<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthRecord extends Model
{
    protected $primaryKey = 'health_record_id';

    protected $fillable = [
        'pet_id',
        'record_type',
        'health_certificate',
        'clinic_name',
        'veterinarian_name',
        'given_date',
        'expiration_date',
        'notes',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'given_date' => 'date',
        'expiration_date' => 'date',
    ];

    /**
     * Get the pet that owns the health record
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet_id', 'pet_id');
    }
}
