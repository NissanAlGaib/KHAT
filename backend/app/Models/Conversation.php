<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $fillable = [
        'match_request_id',
    ];

    /**
     * Get the match request that created this conversation
     */
    public function matchRequest(): BelongsTo
    {
        return $this->belongsTo(MatchRequest::class);
    }

    /**
     * Get the messages in this conversation
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the last message in the conversation
     */
    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latest();
    }
}
