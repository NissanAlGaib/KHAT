<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'contract_id',
        'payment_type',
        'amount',
        'currency',
        'description',
        'paymongo_checkout_id',
        'paymongo_checkout_url',
        'paymongo_payment_id',
        'paymongo_payment_intent_id',
        'paymongo_refund_id',
        'status',
        'pool_status',
        'metadata',
        'paid_at',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Payment type constants
     */
    const TYPE_COLLATERAL = 'collateral';

    const TYPE_SHOOTER_PAYMENT = 'shooter_payment';

    const TYPE_MONETARY_COMPENSATION = 'monetary_compensation';

    const TYPE_SHOOTER_COLLATERAL = 'shooter_collateral';

    const TYPE_SUBSCRIPTION = 'subscription';

    const TYPE_MATCH_REQUEST = 'match_request';

    /**
     * Status constants
     */
    const STATUS_PENDING = 'pending';

    const STATUS_AWAITING_PAYMENT = 'awaiting_payment';

    const STATUS_PROCESSING = 'processing';

    const STATUS_PAID = 'paid';

    const STATUS_FAILED = 'failed';

    const STATUS_EXPIRED = 'expired';

    const STATUS_REFUNDED = 'refunded';

    /**
     * Pool status constants
     */
    const POOL_NOT_POOLED = 'not_pooled';

    const POOL_IN_POOL = 'in_pool';

    const POOL_RELEASED = 'released';

    const POOL_REFUNDED = 'refunded';

    const POOL_FROZEN = 'frozen';

    const POOL_PARTIALLY_REFUNDED = 'partially_refunded';

    /**
     * Get the user who made this payment
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the breeding contract associated with this payment
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(BreedingContract::class, 'contract_id');
    }

    /**
     * Get the pool transactions for this payment
     */
    public function poolTransactions(): HasMany
    {
        return $this->hasMany(PoolTransaction::class);
    }

    /**
     * Check if payment is successful
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    /**
     * Check if payment is pending
     */
    public function isPending(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_AWAITING_PAYMENT,
            self::STATUS_PROCESSING,
        ]);
    }

    /**
     * Mark payment as paid
     */
    public function markAsPaid(?string $paymentId = null): void
    {
        $this->update([
            'status' => self::STATUS_PAID,
            'paid_at' => now(),
            'paymongo_payment_id' => $paymentId ?? $this->paymongo_payment_id,
        ]);
    }

    /**
     * Check if payment is currently in the pool
     */
    public function isInPool(): bool
    {
        return $this->pool_status === self::POOL_IN_POOL;
    }

    /**
     * Check if payment has been released from the pool
     */
    public function isReleased(): bool
    {
        return $this->pool_status === self::POOL_RELEASED;
    }

    /**
     * Check if payment is frozen in the pool
     */
    public function isFrozen(): bool
    {
        return $this->pool_status === self::POOL_FROZEN;
    }

    /**
     * Check if this is a contract-related (poolable) payment type
     */
    public function isPoolable(): bool
    {
        return in_array($this->payment_type, [
            self::TYPE_COLLATERAL,
            self::TYPE_SHOOTER_COLLATERAL,
            self::TYPE_SHOOTER_PAYMENT,
            self::TYPE_MONETARY_COMPENSATION,
        ]);
    }
}
