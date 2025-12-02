<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'status',
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
}
