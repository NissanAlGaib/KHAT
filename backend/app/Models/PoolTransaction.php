<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PoolTransaction extends Model
{
    // Transaction types
    const TYPE_DEPOSIT = 'deposit';
    const TYPE_HOLD = 'hold';
    const TYPE_RELEASE = 'release';
    const TYPE_REFUND = 'refund';
    const TYPE_FEE_DEDUCTION = 'fee_deduction';
    const TYPE_CANCELLATION_PENALTY = 'cancellation_penalty';

    // Statuses
    const STATUS_COMPLETED = 'completed';
    const STATUS_PENDING = 'pending';
    const STATUS_FROZEN = 'frozen';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'payment_id',
        'contract_id',
        'user_id',
        'type',
        'amount',
        'currency',
        'balance_after',
        'status',
        'description',
        'metadata',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'array',
        'processed_at' => 'datetime',
    ];

    /**
     * Get the payment associated with this transaction.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Get the breeding contract associated with this transaction.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(BreedingContract::class, 'contract_id');
    }

    /**
     * Get the user who owns this transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who processed this transaction (if any).
     */
    public function processedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // --- Scopes ---

    /**
     * Scope to deposits only.
     */
    public function scopeDeposits(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_DEPOSIT);
    }

    /**
     * Scope to releases only.
     */
    public function scopeReleases(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_RELEASE);
    }

    /**
     * Scope to refunds only.
     */
    public function scopeRefunds(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_REFUND);
    }

    /**
     * Scope to a specific contract.
     */
    public function scopeForContract(Builder $query, int $contractId): Builder
    {
        return $query->where('contract_id', $contractId);
    }

    /**
     * Scope to frozen transactions.
     */
    public function scopeFrozen(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_FROZEN);
    }

    /**
     * Scope by transaction type.
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to completed transactions.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    // --- Helpers ---

    /**
     * Check if this transaction is frozen.
     */
    public function isFrozen(): bool
    {
        return $this->status === self::STATUS_FROZEN;
    }

    /**
     * Check if this transaction is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if this transaction is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if this is a credit (money entering the pool).
     */
    public function isCredit(): bool
    {
        return in_array($this->type, [self::TYPE_DEPOSIT, self::TYPE_HOLD, self::TYPE_FEE_DEDUCTION, self::TYPE_CANCELLATION_PENALTY]);
    }

    /**
     * Check if this is a debit (money leaving the pool).
     */
    public function isDebit(): bool
    {
        return in_array($this->type, [self::TYPE_RELEASE, self::TYPE_REFUND]);
    }

    /**
     * Get a human-readable label for the transaction type.
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_DEPOSIT => 'Deposit',
            self::TYPE_HOLD => 'Hold',
            self::TYPE_RELEASE => 'Release',
            self::TYPE_REFUND => 'Refund',
            self::TYPE_FEE_DEDUCTION => 'Fee Deduction',
            self::TYPE_CANCELLATION_PENALTY => 'Cancellation Penalty',
            default => ucfirst($this->type),
        };
    }

    /**
     * Get a human-readable label for the status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_FROZEN => 'Frozen',
            self::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst($this->status),
        };
    }
}
