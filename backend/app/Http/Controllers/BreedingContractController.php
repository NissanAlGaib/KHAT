<?php

namespace App\Http\Controllers;

use App\Models\BreedingContract;
use App\Models\Conversation;
use App\Models\Pet;
use Illuminate\Http\Request;

class BreedingContractController extends Controller
{
    /**
     * Create a new breeding contract for a conversation
     */
    public function store(Request $request, $conversationId)
    {
        $validated = $request->validate([
            // Shooter Agreement (Optional)
            'shooter_name' => 'nullable|string|max:255',
            'shooter_payment' => 'nullable|numeric|min:0',
            'shooter_location' => 'nullable|string|max:255',
            'shooter_conditions' => 'nullable|string|max:500',
            // Payment & Compensation
            'end_contract_date' => 'nullable|date|after:today',
            'include_monetary_amount' => 'boolean',
            'monetary_amount' => 'nullable|numeric|min:0',
            'share_offspring' => 'boolean',
            'offspring_split_type' => 'nullable|in:percentage,specific_number',
            'offspring_split_value' => 'nullable|integer|min:0',
            'offspring_selection_method' => 'nullable|in:first_pick,randomized',
            'include_goods_foods' => 'boolean',
            'goods_foods_value' => 'nullable|numeric|min:0',
            // Collateral
            'collateral_total' => 'nullable|numeric|min:0',
            // Terms & Policies
            'pet_care_responsibilities' => 'nullable|string|max:1000',
            'harm_liability_terms' => 'nullable|string|max:1000',
            'cancellation_policy' => 'nullable|string|max:1000',
            'custom_terms' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Verify user has access to this conversation
        $conversation = Conversation::whereHas('matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->find($conversationId);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found or you do not have access',
            ], 404);
        }

        // Check if a contract already exists for this conversation
        if ($conversation->breedingContract) {
            return response()->json([
                'success' => false,
                'message' => 'A contract already exists for this conversation',
            ], 409);
        }

        try {
            // Calculate collateral per owner
            $collateralTotal = $validated['collateral_total'] ?? 0;
            $collateralPerOwner = $collateralTotal > 0 ? $collateralTotal / 2 : 0;

            $contract = BreedingContract::create([
                'conversation_id' => $conversationId,
                'created_by' => $user->id,
                'status' => 'pending_review',
                // Shooter Agreement
                'shooter_name' => $validated['shooter_name'] ?? null,
                'shooter_payment' => $validated['shooter_payment'] ?? null,
                'shooter_location' => $validated['shooter_location'] ?? null,
                'shooter_conditions' => $validated['shooter_conditions'] ?? null,
                // Payment & Compensation
                'end_contract_date' => $validated['end_contract_date'] ?? null,
                'include_monetary_amount' => $validated['include_monetary_amount'] ?? false,
                'monetary_amount' => $validated['monetary_amount'] ?? null,
                'share_offspring' => $validated['share_offspring'] ?? false,
                'offspring_split_type' => $validated['offspring_split_type'] ?? null,
                'offspring_split_value' => $validated['offspring_split_value'] ?? null,
                'offspring_selection_method' => $validated['offspring_selection_method'] ?? null,
                'include_goods_foods' => $validated['include_goods_foods'] ?? false,
                'goods_foods_value' => $validated['goods_foods_value'] ?? null,
                // Collateral
                'collateral_total' => $collateralTotal,
                'collateral_per_owner' => $collateralPerOwner,
                'cancellation_fee_percentage' => 5.00,
                // Terms & Policies
                'pet_care_responsibilities' => $validated['pet_care_responsibilities'] ?? null,
                'harm_liability_terms' => $validated['harm_liability_terms'] ?? null,
                'cancellation_policy' => $validated['cancellation_policy'] ?? null,
                'custom_terms' => $validated['custom_terms'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contract created successfully',
                'data' => $this->formatContract($contract, $user),
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to create contract: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create contract',
            ], 500);
        }
    }

    /**
     * Get the contract for a conversation
     */
    public function show(Request $request, $conversationId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Verify user has access to this conversation
        $conversation = Conversation::whereHas('matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->with('breedingContract')->find($conversationId);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found or you do not have access',
            ], 404);
        }

        if (!$conversation->breedingContract) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatContract($conversation->breedingContract, $user),
        ]);
    }

    /**
     * Update a contract
     */
    public function update(Request $request, $contractId)
    {
        $validated = $request->validate([
            // Shooter Agreement (Optional)
            'shooter_name' => 'nullable|string|max:255',
            'shooter_payment' => 'nullable|numeric|min:0',
            'shooter_location' => 'nullable|string|max:255',
            'shooter_conditions' => 'nullable|string|max:500',
            // Payment & Compensation
            'end_contract_date' => 'nullable|date|after:today',
            'include_monetary_amount' => 'boolean',
            'monetary_amount' => 'nullable|numeric|min:0',
            'share_offspring' => 'boolean',
            'offspring_split_type' => 'nullable|in:percentage,specific_number',
            'offspring_split_value' => 'nullable|integer|min:0',
            'offspring_selection_method' => 'nullable|in:first_pick,randomized',
            'include_goods_foods' => 'boolean',
            'goods_foods_value' => 'nullable|numeric|min:0',
            // Collateral
            'collateral_total' => 'nullable|numeric|min:0',
            // Terms & Policies
            'pet_care_responsibilities' => 'nullable|string|max:1000',
            'harm_liability_terms' => 'nullable|string|max:1000',
            'cancellation_policy' => 'nullable|string|max:1000',
            'custom_terms' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract and verify user has access
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Check if user can edit the contract
        if (!$contract->canBeEditedBy($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot edit this contract at this time. Wait for the other party to respond.',
            ], 403);
        }

        try {
            // Calculate collateral per owner if total is updated
            if (isset($validated['collateral_total'])) {
                $validated['collateral_per_owner'] = $validated['collateral_total'] > 0
                    ? $validated['collateral_total'] / 2
                    : 0;
            }

            // Update contract with new values and mark who edited
            $contract->update(array_merge($validated, [
                'last_edited_by' => $user->id,
                'status' => 'pending_review',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Contract updated successfully',
                'data' => $this->formatContract($contract->fresh(), $user),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to update contract: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update contract',
            ], 500);
        }
    }

    /**
     * Accept a contract
     */
    public function accept(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract and verify user has access
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Check if user can accept the contract
        if (!$contract->canBeAcceptedBy($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot accept this contract. The other party must respond first.',
            ], 403);
        }

        try {
            $updateData = [
                'status' => 'accepted',
                'accepted_at' => now(),
            ];

            // If contract has shooter payment, set shooter_status to pending
            if ($contract->shooter_payment && $contract->shooter_payment > 0) {
                $updateData['shooter_status'] = 'pending';
            }

            $contract->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Contract accepted successfully',
                'data' => $this->formatContract($contract->fresh(), $user),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to accept contract: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept contract',
            ], 500);
        }
    }

    /**
     * Reject a contract (ends the match)
     */
    public function reject(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract and verify user has access
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        if ($contract->status === 'accepted') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject an already accepted contract',
            ], 400);
        }

        if ($contract->status === 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Contract has already been rejected',
            ], 400);
        }

        try {
            $contract->update([
                'status' => 'rejected',
                'rejected_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contract rejected. The match has been ended.',
                'data' => $this->formatContract($contract->fresh(), $user),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to reject contract: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject contract',
            ], 500);
        }
    }

    /**
     * Accept a shooter request (by owner)
     */
    public function acceptShooterRequest(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract and verify user has access
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })
        ->with(['conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet'])
        ->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Check if there's a pending shooter request
        if ($contract->shooter_status !== 'accepted_by_shooter') {
            return response()->json([
                'success' => false,
                'message' => 'No pending shooter request to accept',
            ], 400);
        }

        // Determine if user is owner1 or owner2
        $matchRequest = $contract->conversation->matchRequest;
        $isOwner1 = $matchRequest->requesterPet->user_id === $user->id;
        $isOwner2 = $matchRequest->targetPet->user_id === $user->id;

        if (!$isOwner1 && !$isOwner2) {
            return response()->json([
                'success' => false,
                'message' => 'You are not an owner of this contract',
            ], 403);
        }

        try {
            $updateData = [];
            if ($isOwner1) {
                $updateData['owner1_accepted_shooter'] = true;
            }
            if ($isOwner2) {
                $updateData['owner2_accepted_shooter'] = true;
            }

            $contract->update($updateData);
            $contract->refresh();

            // Check if both owners have accepted
            if ($contract->owner1_accepted_shooter && $contract->owner2_accepted_shooter) {
                $contract->update(['shooter_status' => 'accepted_by_owners']);
            }

            return response()->json([
                'success' => true,
                'message' => $contract->shooter_status === 'accepted_by_owners' 
                    ? 'Both owners have accepted the shooter. Shooter is now confirmed.'
                    : 'You have accepted the shooter request. Waiting for the other owner.',
                'data' => $this->formatContract($contract->fresh(), $user),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to accept shooter request: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept shooter request',
            ], 500);
        }
    }

    /**
     * Decline a shooter request (by owner)
     */
    public function declineShooterRequest(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract and verify user has access
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Check if there's a pending shooter request
        if ($contract->shooter_status !== 'accepted_by_shooter') {
            return response()->json([
                'success' => false,
                'message' => 'No pending shooter request to decline',
            ], 400);
        }

        try {
            // Reset shooter request - make offer available again
            $contract->update([
                'shooter_user_id' => null,
                'shooter_status' => 'pending',
                'shooter_accepted_at' => null,
                'owner1_accepted_shooter' => false,
                'owner2_accepted_shooter' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Shooter request declined. The offer is now available for other shooters.',
                'data' => $this->formatContract($contract->fresh(), $user),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to decline shooter request: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline shooter request',
            ], 500);
        }
    }

    /**
     * Get shooter request status for a contract
     */
    public function getShooterRequest(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract and verify user has access
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })
        ->with(['shooter', 'conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet'])
        ->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Determine if user is owner1 or owner2
        $matchRequest = $contract->conversation->matchRequest;
        $isOwner1 = $matchRequest->requesterPet->user_id === $user->id;

        $shooterData = null;
        if ($contract->shooter) {
            $shooterData = [
                'id' => $contract->shooter->id,
                'name' => $contract->shooter->name,
                'profile_image' => $contract->shooter->profile_image,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'shooter_status' => $contract->shooter_status,
                'shooter' => $shooterData,
                'owner1_accepted' => $contract->owner1_accepted_shooter,
                'owner2_accepted' => $contract->owner2_accepted_shooter,
                'is_owner1' => $isOwner1,
                'current_user_accepted' => $isOwner1 
                    ? $contract->owner1_accepted_shooter 
                    : $contract->owner2_accepted_shooter,
            ],
        ]);
    }

    /**
     * Format contract for API response
     */
    private function formatContract(BreedingContract $contract, $user): array
    {
        $contract->load('shooter');
        
        return [
            'id' => $contract->id,
            'conversation_id' => $contract->conversation_id,
            'created_by' => $contract->created_by,
            'last_edited_by' => $contract->last_edited_by,
            'status' => $contract->status,
            // Shooter Agreement
            'shooter_name' => $contract->shooter_name,
            'shooter_payment' => $contract->shooter_payment,
            'shooter_location' => $contract->shooter_location,
            'shooter_conditions' => $contract->shooter_conditions,
            // Shooter Request Status
            'shooter_user_id' => $contract->shooter_user_id,
            'shooter_status' => $contract->shooter_status,
            'shooter_accepted_at' => $contract->shooter_accepted_at?->toISOString(),
            'owner1_accepted_shooter' => $contract->owner1_accepted_shooter,
            'owner2_accepted_shooter' => $contract->owner2_accepted_shooter,
            'shooter' => $contract->shooter ? [
                'id' => $contract->shooter->id,
                'name' => $contract->shooter->name,
                'profile_image' => $contract->shooter->profile_image,
            ] : null,
            // Payment & Compensation
            'end_contract_date' => $contract->end_contract_date?->format('Y-m-d'),
            'include_monetary_amount' => $contract->include_monetary_amount,
            'monetary_amount' => $contract->monetary_amount,
            'share_offspring' => $contract->share_offspring,
            'offspring_split_type' => $contract->offspring_split_type,
            'offspring_split_value' => $contract->offspring_split_value,
            'offspring_selection_method' => $contract->offspring_selection_method,
            'include_goods_foods' => $contract->include_goods_foods,
            'goods_foods_value' => $contract->goods_foods_value,
            // Collateral
            'collateral_total' => $contract->collateral_total,
            'collateral_per_owner' => $contract->collateral_per_owner,
            'cancellation_fee_percentage' => $contract->cancellation_fee_percentage,
            // Terms & Policies
            'pet_care_responsibilities' => $contract->pet_care_responsibilities,
            'harm_liability_terms' => $contract->harm_liability_terms,
            'cancellation_policy' => $contract->cancellation_policy,
            'custom_terms' => $contract->custom_terms,
            // Timestamps
            'accepted_at' => $contract->accepted_at?->toISOString(),
            'rejected_at' => $contract->rejected_at?->toISOString(),
            'created_at' => $contract->created_at->toISOString(),
            'updated_at' => $contract->updated_at->toISOString(),
            // User-specific fields
            'can_edit' => $contract->canBeEditedBy($user),
            'can_accept' => $contract->canBeAcceptedBy($user),
            'is_creator' => $contract->isCreator($user),
        ];
    }
}
