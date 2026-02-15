<?php

namespace App\Models;

use App\Traits\FiltersByDate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MatchRequest extends Model
{
    use FiltersByDate;

    protected $fillable = [
        'requester_pet_id',
        'target_pet_id',
        'status',
    ];

    /**
     * Get the pet that sent the match request
     */
    public function requesterPet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'requester_pet_id', 'pet_id');
    }

    /**
     * Get the pet that received the match request
     */
    public function targetPet(): BelongsTo
    {
        return $this->belongsTo(Pet::class, 'target_pet_id', 'pet_id');
    }

    /**
     * Get the conversation created from this match request
     */
    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }

    /**
     * Get the reviews associated with this match request
     */
    public function reviews()
    {
        return $this->hasMany(UserReview::class, 'match_id');
    }
}
