<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BreedingContract extends Model
{
    protected $fillable = [
        'conversation_id',
        'created_by',
        'last_edited_by',
        'status',
        // Shooter Agreement
        'shooter_name',
        'shooter_payment',
        'shooter_location',
        'shooter_conditions',
        'shooter_collateral',
        'shooter_collateral_paid',
        // Shooter Offer
        'shooter_user_id',
        'shooter_status',
        'shooter_accepted_at',
        'owner1_accepted_shooter',
        'owner2_accepted_shooter',
        // Payment & Compensation
        'end_contract_date',
        'include_monetary_amount',
        'monetary_amount',
        'share_offspring',
        'offspring_split_type',
        'offspring_split_value',
        'offspring_selection_method',
        'include_goods_foods',
        'goods_foods_value',
        // Collateral
        'collateral_total',
        'collateral_per_owner',
        'cancellation_fee_percentage',
        // Terms & Policies
        'pet_care_responsibilities',
        'harm_liability_terms',
        'cancellation_policy',
        'custom_terms',
        // Timestamps
        'accepted_at',
        'rejected_at',
    ];

    protected $casts = [
        'shooter_payment' => 'decimal:2',
        'shooter_collateral' => 'decimal:2',
        'shooter_collateral_paid' => 'boolean',
        'end_contract_date' => 'date',
        'include_monetary_amount' => 'boolean',
        'monetary_amount' => 'decimal:2',
        'share_offspring' => 'boolean',
        'offspring_split_value' => 'integer',
        'include_goods_foods' => 'boolean',
        'goods_foods_value' => 'decimal:2',
        'collateral_total' => 'decimal:2',
        'collateral_per_owner' => 'decimal:2',
        'cancellation_fee_percentage' => 'decimal:2',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'shooter_accepted_at' => 'datetime',
        'owner1_accepted_shooter' => 'boolean',
        'owner2_accepted_shooter' => 'boolean',
    ];

    /**
     * Get the conversation this contract belongs to
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user who created this contract
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last edited this contract
     */
    public function lastEditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    /**
     * Get the shooter user for this contract
     */
    public function shooter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shooter_user_id');
    }

    /**
     * Calculate each owner's collateral share
     */
    public function getCollateralShareAttribute(): float
    {
        return $this->collateral_total > 0 ? $this->collateral_total / 2 : 0;
    }

    /**
     * Check if this contract has an available shooter offer
     */
    public function hasShooterOffer(): bool
    {
        return $this->status === 'accepted'
            && $this->shooter_payment !== null
            && $this->shooter_payment > 0
            && $this->shooter_status === 'pending';
    }

    /**
     * Check if the given user can edit this contract
     */
    public function canBeEditedBy(User $user): bool
    {
        // Allow editing if status is pending_review or accepted
        if (!in_array($this->status, ['pending_review', 'accepted'])) {
            return false;
        }

        // For accepted contracts, both parties can edit
        if ($this->status === 'accepted') {
            return true;
        }

        // For pending_review, the user who last edited (or created) cannot edit again
        // The other party needs to respond
        $lastEditor = $this->last_edited_by ?? $this->created_by;
        return $lastEditor !== $user->id;
    }

    /**
     * Check if the given user can accept this contract
     */
    public function canBeAcceptedBy(User $user): bool
    {
        // Only allow accepting if status is pending_review
        if ($this->status !== 'pending_review') {
            return false;
        }

        // The user who last edited (or created) cannot accept their own changes
        // The other party needs to accept
        $lastEditor = $this->last_edited_by ?? $this->created_by;
        return $lastEditor !== $user->id;
    }

    /**
     * Check if the given user is the creator of this contract
     */
    public function isCreator(User $user): bool
    {
        return $this->created_by === $user->id;
    }

    /**
     * Check if the given user is the assigned shooter for this contract
     */
    public function isShooter(User $user): bool
    {
        return $this->shooter_user_id === $user->id;
    }

    /**
     * Check if the shooter can edit their contract terms
     * Shooter can only edit when status is 'accepted_by_owners' and collateral is not yet paid
     */
    public function canShooterEditTerms(User $user): bool
    {
        return $this->isShooter($user)
            && $this->shooter_status === 'accepted_by_owners'
            && !$this->shooter_collateral_paid;
    }
}
