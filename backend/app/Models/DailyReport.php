<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyReport extends Model
{
    protected $primaryKey = 'report_id';

    protected $fillable = [
        'contract_id',
        'reported_by',
        'report_date',
        'progress_notes',
        'health_status',
        'health_notes',
        'breeding_attempted',
        'breeding_successful',
        'additional_notes',
    ];

    protected $casts = [
        'report_date' => 'date',
        'breeding_attempted' => 'boolean',
        'breeding_successful' => 'boolean',
    ];

    /**
     * Get the contract this report belongs to
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(BreedingContract::class, 'contract_id');
    }

    /**
     * Get the user who submitted this report
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Check if this report was submitted by a shooter
     */
    public function isFromShooter(): bool
    {
        $contract = $this->contract;
        return $contract && $contract->shooter_user_id === $this->reported_by;
    }

    /**
     * Check if the given user can submit a report for the contract
     */
    public static function canUserReport(BreedingContract $contract, User $user): bool
    {
        // Contract must be accepted and not yet fulfilled
        if ($contract->status !== 'accepted') {
            return false;
        }

        // If there's an assigned shooter with accepted status, only shooter can report
        if ($contract->shooter_user_id && $contract->shooter_status === 'accepted_by_owners') {
            return $contract->shooter_user_id === $user->id;
        }

        // Otherwise, male pet owner can report
        $contract->load('conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet');
        $matchRequest = $contract->conversation->matchRequest;
        
        $requesterPet = $matchRequest->requesterPet;
        $targetPet = $matchRequest->targetPet;
        
        $malePetOwnerId = $requesterPet->sex === 'male' 
            ? $requesterPet->user_id 
            : $targetPet->user_id;
        
        return $malePetOwnerId === $user->id;
    }
}
