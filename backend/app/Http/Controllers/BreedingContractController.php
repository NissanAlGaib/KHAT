<?php

namespace App\Http\Controllers;

use App\Models\BreedingContract;
use App\Models\Conversation;
use App\Models\Litter;
use App\Models\LitterOffspring;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

        // Verify user has access to this conversation (as owner or shooter)
        $conversation = Conversation::where('id', $conversationId)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->with('breedingContract')
            ->first();

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
            // Cast to float to handle decimal string comparison properly
            $shooterPayment = (float) $contract->shooter_payment;
            \Log::info('Contract accept - shooter payment check', [
                'contract_id' => $contract->id,
                'shooter_payment_raw' => $contract->shooter_payment,
                'shooter_payment_float' => $shooterPayment,
                'has_shooter_payment' => $shooterPayment > 0,
            ]);

            if ($shooterPayment > 0) {
                $updateData['shooter_status'] = 'pending';
                \Log::info('Setting shooter_status to pending for contract ' . $contract->id);
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

                // Add shooter to the conversation
                $conversation = $contract->conversation;
                $conversation->update(['shooter_user_id' => $contract->shooter_user_id]);
            }

            return response()->json([
                'success' => true,
                'message' => $contract->shooter_status === 'accepted_by_owners'
                    ? 'Both owners have accepted the shooter. Shooter is now confirmed and added to the conversation.'
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
     * Get count of pending shooter requests for current user's contracts
     */
    public function getPendingShooterRequestsCount(Request $request)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Count contracts where:
        // 1. User has access to the contract (through their pet)
        // 2. Contract is accepted
        // 3. Shooter status is 'accepted_by_shooter' (shooter has accepted, waiting for owner approval)
        // 4. Current user hasn't accepted the shooter yet
        $count = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })
            ->where('status', 'accepted')
            ->where('shooter_status', 'accepted_by_shooter')
            ->where(function ($query) use ($user, $userPetIds) {
                // Check if current user hasn't accepted yet
                $query->where(function ($q) use ($user, $userPetIds) {
                    // For contracts where user is owner1 (requester)
                    $q->whereHas('conversation.matchRequest', function ($subQ) use ($userPetIds) {
                        $subQ->whereIn('requester_pet_id', $userPetIds);
                    })
                        ->where('owner1_accepted_shooter', false);
                })
                    ->orWhere(function ($q) use ($user, $userPetIds) {
                        // For contracts where user is owner2 (target)
                        $q->whereHas('conversation.matchRequest', function ($subQ) use ($userPetIds) {
                            $subQ->whereIn('target_pet_id', $userPetIds)
                                ->whereNotIn('requester_pet_id', $userPetIds);
                        })
                            ->where('owner2_accepted_shooter', false);
                    });
            })
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $count,
            ],
        ]);
    }

    /**
     * Update shooter's contract terms (payment amount and collateral)
     * Shooter must provide collateral to ensure safety of users
     */
    public function shooterUpdateTerms(Request $request, $contractId)
    {
        $validated = $request->validate([
            'shooter_payment' => 'required|numeric|min:0',
            'shooter_collateral' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        // Get the contract where the user is the assigned shooter
        $contract = BreedingContract::where('id', $contractId)
            ->where('shooter_user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found, you are not the assigned shooter, or the contract is not yet accepted by both owners',
            ], 404);
        }

        // Check if shooter can still edit
        if (!$contract->canShooterEditTerms($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot edit the contract terms at this time. Collateral has already been paid.',
            ], 403);
        }

        try {
            // Check if this is first time submitting or if payment was changed
            $isFirstSubmission = !$contract->shooter_collateral_paid;
            $paymentChanged = $contract->shooter_payment != $validated['shooter_payment'];

            $updateData = [
                'shooter_payment' => $validated['shooter_payment'],
                'shooter_collateral' => $validated['shooter_collateral'],
                'shooter_collateral_paid' => true, // Mark collateral as paid when updating
            ];

            // Always require owner approval when shooter submits/updates terms
            // Reset to 'accepted_by_shooter' to require owner re-approval
            $updateData['shooter_status'] = 'accepted_by_shooter';
            $updateData['owner1_accepted_shooter'] = false;
            $updateData['owner2_accepted_shooter'] = false;

            $contract->update($updateData);

            $message = $isFirstSubmission
                ? 'Payment and collateral submitted successfully. Both owners must approve your terms.'
                : ($paymentChanged
                    ? 'Payment and collateral updated. Both owners must re-approve the new payment amount.'
                    : 'Collateral updated. Both owners must approve the changes.');

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $this->formatContractForShooter($contract->fresh()),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to update shooter terms: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shooter terms',
            ], 500);
        }
    }

    /**
     * Submit shooter collateral
     * Shooter must provide collateral for safety of both users' interest
     */
    public function submitShooterCollateral(Request $request, $contractId)
    {
        $validated = $request->validate([
            'collateral_amount' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        // Get the contract where the user is the assigned shooter
        $contract = BreedingContract::where('id', $contractId)
            ->where('shooter_user_id', $user->id)
            ->where('shooter_status', 'accepted_by_owners')
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you are not the assigned shooter',
            ], 404);
        }

        // Check if collateral has already been paid
        if ($contract->shooter_collateral_paid) {
            return response()->json([
                'success' => false,
                'message' => 'Collateral has already been submitted',
            ], 400);
        }

        try {
            $contract->update([
                'shooter_collateral' => $validated['collateral_amount'],
                'shooter_collateral_paid' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Collateral submitted successfully. You are now fully confirmed as the shooter.',
                'data' => $this->formatContractForShooter($contract->fresh()),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to submit shooter collateral: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit collateral',
            ], 500);
        }
    }

    /**
     * Get contract details for shooter
     */
    public function getShooterContract(Request $request, $contractId)
    {
        $user = $request->user();

        // Get the contract where the user is the assigned shooter
        $contract = BreedingContract::where('id', $contractId)
            ->where('shooter_user_id', $user->id)
            ->whereIn('shooter_status', ['accepted_by_shooter', 'accepted_by_owners'])
            ->with([
                'conversation.matchRequest.requesterPet.owner',
                'conversation.matchRequest.requesterPet.photos',
                'conversation.matchRequest.targetPet.owner',
                'conversation.matchRequest.targetPet.photos',
            ])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you are not the assigned shooter',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatContractForShooter($contract),
        ]);
    }

    /**
     * Format contract for shooter's view
     */
    private function formatContractForShooter(BreedingContract $contract): array
    {
        $contract->load(
            'conversation.matchRequest.requesterPet.owner',
            'conversation.matchRequest.requesterPet.photos',
            'conversation.matchRequest.targetPet.owner',
            'conversation.matchRequest.targetPet.photos'
        );

        $matchRequest = $contract->conversation->matchRequest;
        $pet1 = $matchRequest->requesterPet;
        $pet2 = $matchRequest->targetPet;
        $owner1 = $pet1->owner;
        $owner2 = $pet2->owner;

        $pet1Photo = $pet1->photos->where('is_primary', true)->first();
        $pet2Photo = $pet2->photos->where('is_primary', true)->first();

        return [
            'id' => $contract->id,
            'conversation_id' => $contract->conversation_id,
            'status' => $contract->status,
            'shooter_status' => $contract->shooter_status,
            // Pets
            'pet1' => [
                'pet_id' => $pet1->pet_id,
                'name' => $pet1->name,
                'breed' => $pet1->breed,
                'species' => $pet1->species,
                'sex' => $pet1->sex,
                'photo_url' => $pet1Photo?->photo_url,
            ],
            'pet2' => [
                'pet_id' => $pet2->pet_id,
                'name' => $pet2->name,
                'breed' => $pet2->breed,
                'species' => $pet2->species,
                'sex' => $pet2->sex,
                'photo_url' => $pet2Photo?->photo_url,
            ],
            // Owners
            'owner1' => [
                'id' => $owner1->id,
                'name' => $owner1->name,
                'profile_image' => $owner1->profile_image,
            ],
            'owner2' => [
                'id' => $owner2->id,
                'name' => $owner2->name,
                'profile_image' => $owner2->profile_image,
            ],
            // Shooter terms
            'shooter_payment' => $contract->shooter_payment,
            'shooter_location' => $contract->shooter_location,
            'shooter_conditions' => $contract->shooter_conditions,
            'shooter_collateral' => $contract->shooter_collateral,
            'shooter_collateral_paid' => $contract->shooter_collateral_paid,
            'can_edit_payment' => $contract->shooter_status === 'accepted_by_owners' && !$contract->shooter_collateral_paid,
            // Approval status
            'owner1_accepted' => $contract->owner1_accepted_shooter,
            'owner2_accepted' => $contract->owner2_accepted_shooter,
            // Dates
            'end_contract_date' => $contract->end_contract_date?->format('Y-m-d'),
            'created_at' => $contract->created_at->toISOString(),
            'updated_at' => $contract->updated_at->toISOString(),
        ];
    }

    /**
     * Format contract for API response
     */
    private function formatContract(BreedingContract $contract, $user): array
    {
        $contract->load('shooter', 'conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet');

        // Determine if user is owner1 or owner2 or shooter
        $matchRequest = $contract->conversation->matchRequest;
        $isOwner1 = $matchRequest->requesterPet->user_id === $user->id;
        $isOwner2 = $matchRequest->targetPet->user_id === $user->id;
        $isShooter = $contract->shooter_user_id === $user->id;
        $currentUserAcceptedShooter = $isOwner1
            ? $contract->owner1_accepted_shooter
            : $contract->owner2_accepted_shooter;

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
            'shooter_collateral' => $contract->shooter_collateral,
            'shooter_collateral_paid' => $contract->shooter_collateral_paid,
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
            // Breeding completion fields
            'breeding_status' => $contract->breeding_status,
            'breeding_completed_at' => $contract->breeding_completed_at?->toISOString(),
            'has_offspring' => $contract->has_offspring,
            'breeding_notes' => $contract->breeding_notes,
            // User-specific fields
            'can_edit' => $contract->canBeEditedBy($user),
            'can_accept' => $contract->canBeAcceptedBy($user),
            'is_creator' => $contract->isCreator($user),
            'is_owner1' => $isOwner1,
            'is_owner2' => $isOwner2,
            'is_shooter' => $isShooter,
            'can_shooter_edit' => $isShooter ? $contract->canShooterEditTerms($user) : false,
            'current_user_accepted_shooter' => $currentUserAcceptedShooter,
            'can_mark_breeding_complete' => $contract->canMarkBreedingComplete($user),
            'can_input_offspring' => $contract->canInputOffspring($user),
        ];
    }

    /**
     * Mark breeding as complete
     * Only shooter (if assigned) or male pet owner can mark breeding complete
     */
    public function completeBreeding(Request $request, $contractId)
    {
        $validated = $request->validate([
            'breeding_status' => 'required|in:completed,failed',
            'has_offspring' => 'required|boolean',
            'breeding_notes' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract
        $contract = BreedingContract::where('id', $contractId)
            ->where('status', 'accepted')
            ->where(function ($query) use ($userPetIds, $user) {
                // User has access as owner or shooter
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Check if user can mark breeding as complete
        if (!$contract->canMarkBreedingComplete($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to mark this breeding as complete. Only the shooter or male pet owner can do this.',
            ], 403);
        }

        try {
            $contract->update([
                'breeding_status' => $validated['breeding_status'],
                'breeding_completed_by' => $user->id,
                'breeding_completed_at' => now(),
                'has_offspring' => $validated['has_offspring'],
                'breeding_notes' => $validated['breeding_notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => $validated['breeding_status'] === 'completed'
                    ? ($validated['has_offspring']
                        ? 'Breeding marked as complete with offspring. You can now input the offspring details.'
                        : 'Breeding marked as complete without offspring.')
                    : 'Breeding marked as failed.',
                'data' => $this->formatContract($contract->fresh(), $user),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to complete breeding: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete breeding',
            ], 500);
        }
    }

    /**
     * Input offspring for a completed breeding contract
     * Only shooter (if assigned) or male pet owner can input offspring
     */
    public function storeOffspring(Request $request, $contractId)
    {
        $validated = $request->validate([
            'birth_date' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string',
            'offspring' => 'required|array|min:1',
            'offspring.*.name' => 'nullable|string|max:255',
            'offspring.*.sex' => 'required|in:male,female',
            'offspring.*.color' => 'nullable|string|max:255',
            'offspring.*.status' => 'required|in:alive,died,adopted',
            'offspring.*.death_date' => 'required_if:offspring.*.status,died|nullable|date',
            'offspring.*.notes' => 'nullable|string',
            'offspring.*.photo' => 'nullable|string', // Base64 encoded image
        ]);

        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract
        $contract = BreedingContract::where('id', $contractId)
            ->where('status', 'accepted')
            ->where('breeding_status', 'completed')
            ->where('has_offspring', true)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found, breeding not completed, or no offspring indicated',
            ], 404);
        }

        // Check if user can input offspring
        if (!$contract->canInputOffspring($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to input offspring. Only the shooter or male pet owner can do this.',
            ], 403);
        }

        // Check if litter already exists for this contract
        if ($contract->litter) {
            return response()->json([
                'success' => false,
                'message' => 'Offspring have already been recorded for this contract',
            ], 409);
        }

        try {
            DB::beginTransaction();

            // Get sire and dam from contract
            $parents = $contract->getSireAndDam();
            $sire = $parents['sire'];
            $dam = $parents['dam'];

            // Count offspring by sex and status
            $totalOffspring = count($validated['offspring']);
            $maleCount = 0;
            $femaleCount = 0;
            $aliveCount = 0;
            $diedCount = 0;

            foreach ($validated['offspring'] as $offspring) {
                if ($offspring['sex'] === 'male') {
                    $maleCount++;
                } else {
                    $femaleCount++;
                }

                // Count by status - only 'alive' count as living for allocation purposes
                // 'adopted' offspring are not available for allocation
                if ($offspring['status'] === 'alive') {
                    $aliveCount++;
                } elseif ($offspring['status'] === 'died') {
                    $diedCount++;
                }
                // 'adopted' status means offspring was already given away and is not counted in alive/died
            }

            // Create the litter linked to the contract
            $litter = Litter::create([
                'contract_id' => $contract->id,
                'sire_id' => $sire->pet_id,
                'dam_id' => $dam->pet_id,
                'sire_owner_id' => $sire->user_id,
                'dam_owner_id' => $dam->user_id,
                'birth_date' => $validated['birth_date'],
                'total_offspring' => $totalOffspring,
                'alive_offspring' => $aliveCount,
                'died_offspring' => $diedCount,
                'male_count' => $maleCount,
                'female_count' => $femaleCount,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create offspring records
            foreach ($validated['offspring'] as $offspringData) {
                // Handle photo upload if provided
                $photoUrl = null;
                if (!empty($offspringData['photo'])) {
                    try {
                        // Decode base64 image
                        $imageData = $offspringData['photo'];

                        // Check if it's a base64 string or file path
                        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                            // Base64 encoded image
                            $imageData = substr($imageData, strpos($imageData, ',') + 1);
                            $imageData = base64_decode($imageData);
                            $extension = strtolower($type[1]);

                            // Generate unique filename
                            $filename = 'offspring_' . $litter->litter_id . '_' . uniqid() . '.' . $extension;

                            // Save to storage
                            Storage::disk('public')->put('offspring/' . $filename, $imageData);
                            $photoUrl = 'storage/offspring/' . $filename;
                        }
                    } catch (\Exception $e) {
                        \Log::error('Error uploading offspring photo: ' . $e->getMessage());
                        // Continue without photo if upload fails
                    }
                }

                LitterOffspring::create([
                    'litter_id' => $litter->litter_id,
                    'name' => $offspringData['name'] ?? null,
                    'sex' => $offspringData['sex'],
                    'color' => $offspringData['color'] ?? null,
                    'photo_url' => $photoUrl,
                    'status' => $offspringData['status'],
                    'death_date' => $offspringData['death_date'] ?? null,
                    'notes' => $offspringData['notes'] ?? null,
                    'allocation_status' => 'unassigned',
                ]);
            }

            // Update breeding count on parent pets
            $sire->increment('breeding_count');
            $sire->update(['has_been_bred' => true]);

            $dam->increment('breeding_count');
            $dam->update(['has_been_bred' => true]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offspring recorded successfully',
                'data' => [
                    'litter' => $litter->load('offspring'),
                    'contract' => $this->formatContract($contract->fresh(), $user),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to store offspring: ' . $e->getMessage(), [
                'exception' => $e,
                'contract_id' => $contractId,
                'user_id' => $user->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to store offspring: ' . (config('app.debug') ? $e->getMessage() : 'An error occurred'),
            ], 500);
        }
    }

    /**
     * Get offspring for a contract
     */
    public function getOffspring(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract with litter
        $contract = BreedingContract::where('id', $contractId)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->with(['litter.offspring.assignedTo', 'litter.sire', 'litter.dam'])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        if (!$contract->litter) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        $litter = $contract->litter;

        return response()->json([
            'success' => true,
            'data' => [
                'litter_id' => $litter->litter_id,
                'birth_date' => $litter->birth_date->format('Y-m-d'),
                'statistics' => [
                    'total_offspring' => $litter->total_offspring,
                    'alive_offspring' => $litter->alive_offspring,
                    'died_offspring' => $litter->died_offspring,
                    'male_count' => $litter->male_count,
                    'female_count' => $litter->female_count,
                ],
                'parents' => [
                    'sire' => [
                        'pet_id' => $litter->sire->pet_id,
                        'name' => $litter->sire->name,
                    ],
                    'dam' => [
                        'pet_id' => $litter->dam->pet_id,
                        'name' => $litter->dam->name,
                    ],
                ],
                'offspring' => $litter->offspring->map(function ($offspring) {
                    return [
                        'offspring_id' => $offspring->offspring_id,
                        'name' => $offspring->name,
                        'sex' => $offspring->sex,
                        'color' => $offspring->color,
                        'status' => $offspring->status,
                        'allocation_status' => $offspring->allocation_status,
                        'assigned_to' => $offspring->assignedTo ? [
                            'id' => $offspring->assignedTo->id,
                            'name' => $offspring->assignedTo->name,
                        ] : null,
                        'selection_order' => $offspring->selection_order,
                    ];
                }),
                'share_offspring' => $contract->share_offspring,
                'offspring_split_type' => $contract->offspring_split_type,
                'offspring_split_value' => $contract->offspring_split_value,
                'offspring_selection_method' => $contract->offspring_selection_method,
            ],
        ]);
    }

    /**
     * Allocate offspring based on contract compensation
     * Distributes offspring between sire and dam owners based on contract terms
     */
    public function allocateOffspring(Request $request, $contractId)
    {
        $validated = $request->validate([
            'allocations' => 'required|array',
            'allocations.*.offspring_id' => 'required|integer',
            'allocations.*.assigned_to' => 'required|integer',
            'allocations.*.selection_order' => 'nullable|integer',
        ]);

        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract with litter
        $contract = BreedingContract::where('id', $contractId)
            ->where('status', 'accepted')
            ->where('breeding_status', 'completed')
            ->where('share_offspring', true)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->with(['litter.offspring', 'conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet'])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found, offspring sharing not enabled, or you do not have access',
            ], 404);
        }

        if (!$contract->litter) {
            return response()->json([
                'success' => false,
                'message' => 'No offspring recorded for this contract yet',
            ], 400);
        }

        // Verify the user can allocate (shooter or male pet owner)
        if (!$contract->canInputOffspring($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to allocate offspring. Only the shooter or male pet owner can do this.',
            ], 403);
        }

        // Get valid owner IDs
        $matchRequest = $contract->conversation->matchRequest;
        $owner1Id = $matchRequest->requesterPet->user_id;
        $owner2Id = $matchRequest->targetPet->user_id;
        $validOwnerIds = [$owner1Id, $owner2Id];

        // Validate all offspring_ids and assigned_to values
        $litterOffspringIds = $contract->litter->offspring->pluck('offspring_id')->toArray();
        foreach ($validated['allocations'] as $allocation) {
            if (!in_array($allocation['offspring_id'], $litterOffspringIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid offspring ID: ' . $allocation['offspring_id'],
                ], 400);
            }
            if (!in_array($allocation['assigned_to'], $validOwnerIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid owner ID. Offspring can only be assigned to contract owners.',
                ], 400);
            }
        }

        try {
            DB::beginTransaction();

            foreach ($validated['allocations'] as $allocation) {
                LitterOffspring::where('offspring_id', $allocation['offspring_id'])
                    ->update([
                        'assigned_to' => $allocation['assigned_to'],
                        'allocation_status' => 'assigned',
                        'selection_order' => $allocation['selection_order'] ?? null,
                    ]);
            }

            DB::commit();

            // Reload the litter with updated offspring
            $contract->load(['litter.offspring.assignedTo']);

            return response()->json([
                'success' => true,
                'message' => 'Offspring allocated successfully',
                'data' => [
                    'offspring' => $contract->litter->offspring->map(function ($offspring) {
                        return [
                            'offspring_id' => $offspring->offspring_id,
                            'name' => $offspring->name,
                            'sex' => $offspring->sex,
                            'allocation_status' => $offspring->allocation_status,
                            'assigned_to' => $offspring->assignedTo ? [
                                'id' => $offspring->assignedTo->id,
                                'name' => $offspring->assignedTo->name,
                            ] : null,
                            'selection_order' => $offspring->selection_order,
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to allocate offspring: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to allocate offspring',
            ], 500);
        }
    }

    /**
     * Auto-allocate offspring based on contract terms
     * Uses contract's split type and selection method to distribute
     */
    public function autoAllocateOffspring(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract with litter
        $contract = BreedingContract::where('id', $contractId)
            ->where('status', 'accepted')
            ->where('breeding_status', 'completed')
            ->where('share_offspring', true)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->with(['litter.offspring', 'conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet'])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found, offspring sharing not enabled, or you do not have access',
            ], 404);
        }

        if (!$contract->litter) {
            return response()->json([
                'success' => false,
                'message' => 'No offspring recorded for this contract yet',
            ], 400);
        }

        // Verify the user can allocate
        if (!$contract->canInputOffspring($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to allocate offspring.',
            ], 403);
        }

        // Get sire and dam owners
        $parents = $contract->getSireAndDam();
        $sireOwnerId = $parents['sire']->user_id;
        $damOwnerId = $parents['dam']->user_id;

        // Get only 'alive' offspring for allocation
        // 'adopted' offspring are already given away and not available for allocation
        $aliveOffspring = $contract->litter->offspring
            ->filter(fn($o) => $o->status === 'alive')
            ->values();

        if ($aliveOffspring->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No alive offspring to allocate',
            ], 400);
        }

        $totalAlive = $aliveOffspring->count();
        $splitType = $contract->offspring_split_type;
        $splitValue = $contract->offspring_split_value;
        $selectionMethod = $contract->offspring_selection_method;

        // Calculate how many go to dam owner (contract specifies dam owner's share)
        $damOwnerCount = 0;
        if ($splitType === 'percentage') {
            $damOwnerCount = (int) ceil(($splitValue / 100) * $totalAlive);
        } elseif ($splitType === 'specific_number') {
            $damOwnerCount = min($splitValue, $totalAlive);
        }
        $sireOwnerCount = $totalAlive - $damOwnerCount;

        try {
            DB::beginTransaction();

            // Prepare offspring list based on selection method
            $offspringList = $aliveOffspring;
            if ($selectionMethod === 'randomized') {
                $offspringList = $offspringList->shuffle();
            }
            // For 'first_pick', dam owner picks first (gets first in list)

            $order = 1;
            foreach ($offspringList as $index => $offspring) {
                // First $damOwnerCount go to dam owner, rest to sire owner
                $assignedTo = $index < $damOwnerCount ? $damOwnerId : $sireOwnerId;

                LitterOffspring::where('offspring_id', $offspring->offspring_id)
                    ->update([
                        'assigned_to' => $assignedTo,
                        'allocation_status' => 'assigned',
                        'selection_order' => $order++,
                    ]);
            }

            DB::commit();

            // Reload the litter with updated offspring
            $contract->load(['litter.offspring.assignedTo']);

            return response()->json([
                'success' => true,
                'message' => 'Offspring auto-allocated successfully',
                'data' => [
                    'allocation_summary' => [
                        'total_alive' => $totalAlive,
                        'dam_owner_receives' => $damOwnerCount,
                        'sire_owner_receives' => $sireOwnerCount,
                        'selection_method' => $selectionMethod,
                    ],
                    'offspring' => $contract->litter->offspring->map(function ($offspring) {
                        return [
                            'offspring_id' => $offspring->offspring_id,
                            'name' => $offspring->name,
                            'sex' => $offspring->sex,
                            'status' => $offspring->status,
                            'allocation_status' => $offspring->allocation_status,
                            'assigned_to' => $offspring->assignedTo ? [
                                'id' => $offspring->assignedTo->id,
                                'name' => $offspring->assignedTo->name,
                            ] : null,
                            'selection_order' => $offspring->selection_order,
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to auto-allocate offspring: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to auto-allocate offspring',
            ], 500);
        }
    }

    /**
     * Complete the match after offspring allocation
     * Marks the contract as fulfilled and archives the conversation
     */
    public function completeMatch(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract with litter
        $contract = BreedingContract::where('id', $contractId)
            ->where('status', 'accepted')
            ->where('breeding_status', 'completed')
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->with(['litter.offspring', 'conversation'])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or breeding not completed',
            ], 404);
        }

        // Check if contract has offspring and they are allocated
        if ($contract->has_offspring && $contract->share_offspring) {
            if (!$contract->litter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Offspring have not been recorded yet',
                ], 400);
            }

            // Check if all alive offspring are allocated
            $unallocatedCount = $contract->litter->offspring
                ->filter(fn($o) => $o->status === 'alive' && $o->allocation_status === 'unassigned')
                ->count();

            if ($unallocatedCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "There are {$unallocatedCount} offspring that have not been allocated yet",
                ], 400);
            }
        }

        try {
            DB::beginTransaction();

            // Update contract status to fulfilled
            $contract->update([
                'status' => 'fulfilled',
            ]);

            // Update litter status to completed if exists
            if ($contract->litter) {
                $contract->litter->update([
                    'status' => 'completed',
                ]);
            }

            // Mark the conversation as completed and archive it
            $conversation = $contract->conversation;
            $conversation->update([
                'status' => 'completed',
                'completed_at' => now(),
                'archived_at' => now(),
            ]);

            // Update match request status to completed
            $conversation->matchRequest->update([
                'status' => 'completed',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Match completed successfully! The conversation has been archived.',
                'data' => [
                    'contract_id' => $contract->id,
                    'conversation_id' => $conversation->id,
                    'status' => 'completed',
                    'archived_at' => $conversation->archived_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to complete match: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete match',
            ], 500);
        }
    }

    /**
     * Get offspring allocation summary based on contract terms
     * Shows how many offspring each owner should receive
     */
    public function getOffspringAllocationSummary(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the contract with litter
        $contract = BreedingContract::where('id', $contractId)
            ->where('status', 'accepted')
            ->where('breeding_status', 'completed')
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('conversation.matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->with(['litter.offspring.assignedTo', 'litter.sire', 'litter.dam', 'litter.sireOwner', 'litter.damOwner'])
            ->first();

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or breeding not completed',
            ], 404);
        }

        if (!$contract->litter) {
            return response()->json([
                'success' => false,
                'message' => 'No offspring recorded for this contract',
            ], 404);
        }

        $litter = $contract->litter;

        // Get alive offspring for allocation
        $aliveOffspring = $litter->offspring->filter(fn($o) => $o->status === 'alive');
        $totalAlive = $aliveOffspring->count();

        // Calculate allocation based on contract terms
        $splitType = $contract->offspring_split_type;
        $splitValue = $contract->offspring_split_value;
        $selectionMethod = $contract->offspring_selection_method;

        // Dam owner receives the contract specified share
        $damOwnerCount = 0;
        if ($splitType === 'percentage') {
            $damOwnerCount = (int) ceil(($splitValue / 100) * $totalAlive);
        } elseif ($splitType === 'specific_number') {
            $damOwnerCount = min($splitValue, $totalAlive);
        }
        $sireOwnerCount = $totalAlive - $damOwnerCount;

        // Count current allocations
        $allocatedToDamOwner = $aliveOffspring->filter(fn($o) => $o->assigned_to === $litter->dam_owner_id)->count();
        $allocatedToSireOwner = $aliveOffspring->filter(fn($o) => $o->assigned_to === $litter->sire_owner_id)->count();
        $unallocatedCount = $aliveOffspring->filter(fn($o) => $o->allocation_status === 'unassigned')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'contract_id' => $contract->id,
                'litter_id' => $litter->litter_id,
                'share_offspring' => $contract->share_offspring,
                'allocation_method' => [
                    'split_type' => $splitType,
                    'split_value' => $splitValue,
                    'selection_method' => $selectionMethod,
                    'selection_method_label' => $selectionMethod === 'first_pick' ? 'First Pick (Dam Owner)' : 'Randomized',
                ],
                'statistics' => [
                    'total_alive' => $totalAlive,
                    'total_died' => $litter->died_offspring,
                    'male_count' => $litter->male_count,
                    'female_count' => $litter->female_count,
                ],
                'expected_allocation' => [
                    'dam_owner' => [
                        'id' => $litter->dam_owner_id,
                        'name' => $litter->damOwner->name,
                        'expected_count' => $damOwnerCount,
                        'current_count' => $allocatedToDamOwner,
                    ],
                    'sire_owner' => [
                        'id' => $litter->sire_owner_id,
                        'name' => $litter->sireOwner->name,
                        'expected_count' => $sireOwnerCount,
                        'current_count' => $allocatedToSireOwner,
                    ],
                ],
                'unallocated_count' => $unallocatedCount,
                'is_fully_allocated' => $unallocatedCount === 0,
                'can_complete_match' => $unallocatedCount === 0 || !$contract->share_offspring,
                'parents' => [
                    'sire' => [
                        'pet_id' => $litter->sire->pet_id,
                        'name' => $litter->sire->name,
                        'owner_id' => $litter->sire_owner_id,
                        'owner_name' => $litter->sireOwner->name,
                    ],
                    'dam' => [
                        'pet_id' => $litter->dam->pet_id,
                        'name' => $litter->dam->name,
                        'owner_id' => $litter->dam_owner_id,
                        'owner_name' => $litter->damOwner->name,
                    ],
                ],
                'offspring' => $litter->offspring->map(function ($offspring) {
                    return [
                        'offspring_id' => $offspring->offspring_id,
                        'name' => $offspring->name,
                        'sex' => $offspring->sex,
                        'color' => $offspring->color,
                        'photo_url' => $offspring->photo_url,
                        'status' => $offspring->status,
                        'allocation_status' => $offspring->allocation_status,
                        'assigned_to' => $offspring->assignedTo ? [
                            'id' => $offspring->assignedTo->id,
                            'name' => $offspring->assignedTo->name,
                        ] : null,
                        'selection_order' => $offspring->selection_order,
                    ];
                }),
            ],
        ]);
    }
}
