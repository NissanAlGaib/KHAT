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
     * Calculate each owner's collateral share
     */
    public function getCollateralShareAttribute(): float
    {
        return $this->collateral_total > 0 ? $this->collateral_total / 2 : 0;
    }

    /**
     * Check if the given user can edit this contract
     */
    public function canBeEditedBy(User $user): bool
    {
        // Only allow editing if status is pending_review
        if ($this->status !== 'pending_review') {
            return false;
        }

        // The user who last edited (or created) cannot edit again
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
}
