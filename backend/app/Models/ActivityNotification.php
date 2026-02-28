<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityNotification extends Model
{
    protected $table = 'activity_notifications';

    // Notification types
    const TYPE_MATCH_REQUEST = 'match_request';
    const TYPE_MATCH_ACCEPTED = 'match_accepted';
    const TYPE_MATCH_DECLINED = 'match_declined';
    const TYPE_NEW_MESSAGE = 'new_message';
    const TYPE_SYSTEM = 'system';
    const TYPE_SHOOTER_REQUEST = 'shooter_request';
    const TYPE_SHOOTER_ACCEPTED = 'shooter_accepted';
    const TYPE_CONTRACT_COMPLETED = 'contract_completed';
    const TYPE_SUBSCRIPTION = 'subscription';
    const TYPE_PAYMENT = 'payment';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ─── Relationships ──────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ─────────────────────────────────────────────────

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ─── Helpers ────────────────────────────────────────────────

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function markAsRead(): void
    {
        if (!$this->isRead()) {
            $this->update(['read_at' => now()]);
        }
    }

    /**
     * Get icon name for the notification type (used by frontend)
     */
    public function getIconAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_MATCH_REQUEST => 'heart',
            self::TYPE_MATCH_ACCEPTED => 'check-circle',
            self::TYPE_MATCH_DECLINED => 'x-circle',
            self::TYPE_NEW_MESSAGE => 'message-circle',
            self::TYPE_SYSTEM => 'info',
            self::TYPE_SHOOTER_REQUEST => 'camera',
            self::TYPE_SHOOTER_ACCEPTED => 'check-square',
            self::TYPE_CONTRACT_COMPLETED => 'award',
            self::TYPE_SUBSCRIPTION => 'star',
            self::TYPE_PAYMENT => 'credit-card',
            default => 'bell',
        };
    }

    /**
     * Get color for the notification type (used by frontend)
     */
    public function getColorAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_MATCH_REQUEST => '#FF6B4A',
            self::TYPE_MATCH_ACCEPTED => '#22C55E',
            self::TYPE_MATCH_DECLINED => '#EF4444',
            self::TYPE_NEW_MESSAGE => '#3B82F6',
            self::TYPE_SYSTEM => '#6B7280',
            self::TYPE_SHOOTER_REQUEST => '#F59E0B',
            self::TYPE_SHOOTER_ACCEPTED => '#10B981',
            self::TYPE_CONTRACT_COMPLETED => '#8B5CF6',
            self::TYPE_SUBSCRIPTION => '#F59E0B',
            self::TYPE_PAYMENT => '#8B5CF6',
            default => '#6B7280',
        };
    }
}
