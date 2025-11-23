<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LitterOffspring extends Model
{
    use SoftDeletes;

    protected $table = 'litter_offspring';
    protected $primaryKey = 'offspring_id';

    protected $fillable = [
        'litter_id',
        'pet_id',
        'name',
        'sex',
        'color',
        'photo_url',
        'status',
        'death_date',
        'notes',
    ];

    protected $casts = [
        'death_date' => 'date',
    ];

    /**
     * Get the litter this offspring belongs to
     */
    public function litter(): BelongsTo
    {
        return $this->belongsTo(Litter::class, 'litter_id', 'litter_id');
    }

    /**
     * Get the pet record if this offspring is registered
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet_id', 'pet_id');
    }
}
