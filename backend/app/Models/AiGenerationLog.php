<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGenerationLog extends Model
{
    protected $fillable = [
        'user_id',
        'pet1_id',
        'pet2_id',
        'image_path',
        'prompt_used',
        'source_mode',
        'source_photo_count',
        'source_photo_ids',
    ];

    protected $casts = [
        'source_photo_count' => 'integer',
        'source_photo_ids' => 'array',
    ];

    /**
     * Get the user who generated this image.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the first parent pet.
     */
    public function pet1(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet1_id', 'pet_id');
    }

    /**
     * Get the second parent pet.
     */
    public function pet2(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'pet2_id', 'pet_id');
    }
}
