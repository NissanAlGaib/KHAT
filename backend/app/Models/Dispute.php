<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Dispute extends Model
{
    // Statuses
    const STATUS_OPEN = 'open';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_DISMISSED = 'dismissed';

    // Resolution types
    const RESOLUTION_REFUND_FULL = 'refund_full';
    const RESOLUTION_REFUND_PARTIAL = 'refund_partial';
    const RESOLUTION_RELEASE_FUNDS = 'release_funds';
    const RESOLUTION_FORFEIT = 'forfeit';

    protected $fillable = [
        'contract_id',
        'raised_by',
        'resolved_by',
        'reason',
        'resolution_notes',
        'status',
        'resolution_type',
        'resolved_amount',
        'metadata',
    ];

    protected $casts = [
        'resolved_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    /**
     * Get the breeding contract associated with this dispute.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(BreedingContract::class, 'contract_id');
    }

    /**
     * Get the user who raised this dispute.
     */
    public function raisedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'raised_by');
    }

    /**
     * Get the admin who resolved this dispute.
     */
    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // --- Scopes ---

    /**
     * Scope to open disputes.
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    /**
     * Scope to active (unresolved) disputes.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_OPEN, self::STATUS_UNDER_REVIEW]);
    }

    /**
     * Scope to disputes for a specific contract.
     */
    public function scopeForContract(Builder $query, int $contractId): Builder
    {
        return $query->where('contract_id', $contractId);
    }

    // --- Helpers ---

    /**
     * Check if this dispute is still active (open or under review).
     */
    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_OPEN, self::STATUS_UNDER_REVIEW]);
    }

    /**
     * Check if this dispute has been resolved.
     */
    public function isResolved(): bool
    {
        return $this->status === self::STATUS_RESOLVED;
    }

    /**
     * Check if this dispute has been dismissed.
     */
    public function isDismissed(): bool
    {
        return $this->status === self::STATUS_DISMISSED;
    }

    /**
     * Get a human-readable label for the status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_OPEN => 'Open',
            self::STATUS_UNDER_REVIEW => 'Under Review',
            self::STATUS_RESOLVED => 'Resolved',
            self::STATUS_DISMISSED => 'Dismissed',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get a human-readable label for the resolution type.
     */
    public function getResolutionTypeLabelAttribute(): string
    {
        return match ($this->resolution_type) {
            self::RESOLUTION_REFUND_FULL => 'Full Refund',
            self::RESOLUTION_REFUND_PARTIAL => 'Partial Refund',
            self::RESOLUTION_RELEASE_FUNDS => 'Release Funds',
            self::RESOLUTION_FORFEIT => 'Forfeit',
            default => $this->resolution_type ? ucfirst(str_replace('_', ' ', $this->resolution_type)) : 'N/A',
        };
    }
}
