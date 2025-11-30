<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'match_request_id',
        'shooter_user_id',
        'status',
        'completed_at',
        'archived_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * Get the shooter user for this conversation
     */
    public function shooter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shooter_user_id');
    }

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

    /**
     * Get the breeding contract for this conversation
     */
    public function breedingContract(): HasOne
    {
        return $this->hasOne(BreedingContract::class);
    }

    /**
     * Check if the conversation is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' || $this->status === null;
    }

    /**
     * Check if the conversation is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the conversation is archived
     */
    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    /**
     * Mark the conversation as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Archive the conversation
     */
    public function archive(): void
    {
        $this->update([
            'status' => 'archived',
            'archived_at' => now(),
        ]);
    }
}
