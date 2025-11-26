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
        // Breeding Completion
        'breeding_status',
        'breeding_completed_by',
        'breeding_completed_at',
        'has_offspring',
        'breeding_notes',
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
        'breeding_completed_at' => 'datetime',
        'has_offspring' => 'boolean',
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

    /**
     * Get the litter associated with this contract
     */
    public function litter(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Litter::class, 'contract_id');
    }

    /**
     * Get the user who completed the breeding
     */
    public function breedingCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'breeding_completed_by');
    }

    /**
     * Check if the given user can mark breeding as complete
     * - Shooter if assigned and accepted by owners
     * - Male pet owner if no shooter
     */
    public function canMarkBreedingComplete(User $user): bool
    {
        // Only accepted contracts with in_progress or pending breeding status can be completed
        if ($this->status !== 'accepted' || !in_array($this->breeding_status, ['pending', 'in_progress'])) {
            return false;
        }

        // If shooter is assigned and accepted by both owners, only shooter can complete
        if ($this->shooter_user_id && $this->shooter_status === 'accepted_by_owners') {
            return $this->shooter_user_id === $user->id;
        }

        // Otherwise, the male pet owner can complete
        $this->load('conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet');
        $matchRequest = $this->conversation->matchRequest;
        
        // Find the male pet owner
        $requesterPet = $matchRequest->requesterPet;
        $targetPet = $matchRequest->targetPet;
        
        $malePetOwnerId = $requesterPet->sex === 'male' 
            ? $requesterPet->user_id 
            : $targetPet->user_id;
        
        return $malePetOwnerId === $user->id;
    }

    /**
     * Check if the given user can input offspring for this contract
     * - Shooter if assigned and accepted by owners
     * - Male pet owner if no shooter
     */
    public function canInputOffspring(User $user): bool
    {
        // Only completed contracts with offspring can have offspring input
        if ($this->status !== 'accepted' || $this->breeding_status !== 'completed' || !$this->has_offspring) {
            return false;
        }

        // If shooter is assigned and accepted by both owners, only shooter can input
        if ($this->shooter_user_id && $this->shooter_status === 'accepted_by_owners') {
            return $this->shooter_user_id === $user->id;
        }

        // Otherwise, the male pet owner can input
        $this->load('conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet');
        $matchRequest = $this->conversation->matchRequest;
        
        // Find the male pet owner
        $requesterPet = $matchRequest->requesterPet;
        $targetPet = $matchRequest->targetPet;
        
        $malePetOwnerId = $requesterPet->sex === 'male' 
            ? $requesterPet->user_id 
            : $targetPet->user_id;
        
        return $malePetOwnerId === $user->id;
    }

    /**
     * Get the sire and dam from the match request
     */
    public function getSireAndDam(): array
    {
        $this->load('conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet');
        $matchRequest = $this->conversation->matchRequest;
        
        $requesterPet = $matchRequest->requesterPet;
        $targetPet = $matchRequest->targetPet;
        
        if ($requesterPet->sex === 'male') {
            return ['sire' => $requesterPet, 'dam' => $targetPet];
        }
        
        return ['sire' => $targetPet, 'dam' => $requesterPet];
    }
}
