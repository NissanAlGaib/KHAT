<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\MatchRequest;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Pet;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MatchRequestController extends Controller
{
    private PayMongoService $payMongoService;

    public function __construct(PayMongoService $payMongoService)
    {
        $this->payMongoService = $payMongoService;
    }

    /**
     * Check if user is on free tier and needs to pay for match requests
     */
    private function requiresPayment($user): bool
    {
        // Free tier or null subscription requires payment
        $tier = $user->subscription_tier ?? 'free';

        return $tier === 'free';
    }

    /**
     * Get the match request fee for free tier users
     */
    private function getMatchRequestFee(): float
    {
        // Fee of 50 PHP per match request for free tier users
        return 50.00;
    }

    /**
     * Check if user has a valid paid match request payment for a specific target pet
     */
    private function hasValidMatchPayment($userId, $targetPetId): bool
    {
        // Convert to string for JSON comparison as MySQL JSON functions are type-sensitive
        $targetPetIdStr = (string) $targetPetId;
        $targetPetIdInt = (int) $targetPetId;

        $payment = Payment::where('user_id', $userId)
            ->where('payment_type', Payment::TYPE_MATCH_REQUEST)
            ->where('status', Payment::STATUS_PAID)
            ->where(function ($query) use ($targetPetIdInt, $targetPetIdStr) {
                // Check both integer and string representations in metadata
                $query->whereJsonContains('metadata->target_pet_id', $targetPetIdInt)
                    ->orWhereJsonContains('metadata->target_pet_id', $targetPetIdStr)
                    ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.target_pet_id')) = ?", [$targetPetIdStr]);
            })
            ->first();

        Log::info('hasValidMatchPayment check', [
            'user_id' => $userId,
            'target_pet_id' => $targetPetId,
            'found_payment' => $payment ? $payment->id : null,
            'payment_status' => $payment?->status,
        ]);

        return $payment !== null;
    }

    /**
     * Send a match request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'requester_pet_id' => 'required|integer|exists:pets,pet_id',
            'target_pet_id' => 'required|integer|exists:pets,pet_id',
        ]);

        $user = $request->user();

        // Verify the requester pet belongs to the authenticated user
        $requesterPet = Pet::where('pet_id', $validated['requester_pet_id'])
            ->where('user_id', $user->id)
            ->first();

        if (! $requesterPet) {
            return response()->json([
                'success' => false,
                'message' => 'You can only send match requests from your own pets',
            ], 403);
        }

        // Verify the target pet exists and doesn't belong to the authenticated user
        $targetPet = Pet::where('pet_id', $validated['target_pet_id'])->first();

        if (! $targetPet) {
            return response()->json([
                'success' => false,
                'message' => 'Target pet not found',
            ], 404);
        }

        if ($targetPet->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot send a match request to your own pet',
            ], 400);
        }

        // Check if a match request already exists between these pets
        $existingRequest = MatchRequest::where(function ($query) use ($validated) {
            $query->where('requester_pet_id', $validated['requester_pet_id'])
                ->where('target_pet_id', $validated['target_pet_id']);
        })->orWhere(function ($query) use ($validated) {
            $query->where('requester_pet_id', $validated['target_pet_id'])
                ->where('target_pet_id', $validated['requester_pet_id']);
        })->first();

        if ($existingRequest) {
            return response()->json([
                'success' => false,
                'message' => 'A match request already exists between these pets',
                'data' => $existingRequest,
            ], 409);
        }

        // Check if free tier user needs to pay
        if ($this->requiresPayment($user)) {
            // Check if they have a valid payment for this match
            $hasPayment = $this->hasValidMatchPayment($user->id, $validated['target_pet_id']);

            Log::info('Match request payment check', [
                'user_id' => $user->id,
                'target_pet_id' => $validated['target_pet_id'],
                'requires_payment' => true,
                'has_valid_payment' => $hasPayment,
            ]);

            if (!$hasPayment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment required for match request',
                    'requires_payment' => true,
                    'payment_amount' => $this->getMatchRequestFee(),
                    'target_pet_id' => $validated['target_pet_id'],
                    'requester_pet_id' => $validated['requester_pet_id'],
                ], 402); // 402 Payment Required
            }
        }

        try {
            $matchRequest = MatchRequest::create([
                'requester_pet_id' => $validated['requester_pet_id'],
                'target_pet_id' => $validated['target_pet_id'],
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Match request sent successfully',
                'data' => $matchRequest->load(['requesterPet', 'targetPet']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send match request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a payment checkout for match request (free tier users)
     */
    public function createMatchPayment(Request $request)
    {
        $validated = $request->validate([
            'requester_pet_id' => 'required|integer|exists:pets,pet_id',
            'target_pet_id' => 'required|integer|exists:pets,pet_id',
            'success_url' => 'required|url',
            'cancel_url' => 'required|url',
        ]);

        $user = $request->user();

        // Verify user is on free tier
        if (! $this->requiresPayment($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not required for your subscription tier',
            ], 400);
        }

        // Verify the requester pet belongs to the user
        $requesterPet = Pet::where('pet_id', $validated['requester_pet_id'])
            ->where('user_id', $user->id)
            ->first();

        if (! $requesterPet) {
            return response()->json([
                'success' => false,
                'message' => 'You can only pay for match requests from your own pets',
            ], 403);
        }

        // Verify target pet exists
        $targetPet = Pet::where('pet_id', $validated['target_pet_id'])->first();
        if (! $targetPet) {
            return response()->json([
                'success' => false,
                'message' => 'Target pet not found',
            ], 404);
        }

        // Check if they already have a valid payment
        if ($this->hasValidMatchPayment($user->id, $validated['target_pet_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a valid payment for this match request',
            ], 400);
        }

        // Check if PayMongo is configured
        if (! $this->payMongoService->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Payment service not configured',
            ], 503);
        }

        // Check for existing pending payment
        $existingPayment = Payment::where('user_id', $user->id)
            ->where('payment_type', Payment::TYPE_MATCH_REQUEST)
            ->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_AWAITING_PAYMENT])
            ->whereJsonContains('metadata->target_pet_id', $validated['target_pet_id'])
            ->first();

        if ($existingPayment) {
            // Return existing checkout URL if still valid
            if ($existingPayment->expires_at && $existingPayment->expires_at > now()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'payment_id' => $existingPayment->id,
                        'checkout_url' => $existingPayment->paymongo_checkout_url,
                        'expires_at' => $existingPayment->expires_at->toISOString(),
                    ],
                ]);
            }
            // Mark expired payment as expired
            $existingPayment->update(['status' => Payment::STATUS_EXPIRED]);
        }

        try {
            $amount = $this->getMatchRequestFee();
            $description = "Match Request Fee - {$requesterPet->name} → {$targetPet->name}";

            // Create PayMongo checkout session
            $result = $this->payMongoService->createCheckoutSession([
                'amount' => $amount,
                'currency' => 'PHP',
                'name' => $description,
                'description' => $description,
                'success_url' => $validated['success_url'],
                'cancel_url' => $validated['cancel_url'],
                'reference_number' => "MATCH-{$user->id}-{$validated['requester_pet_id']}-{$validated['target_pet_id']}",
                'metadata' => [
                    'user_id' => $user->id,
                    'requester_pet_id' => $validated['requester_pet_id'],
                    'target_pet_id' => $validated['target_pet_id'],
                    'type' => 'match_request',
                ],
            ]);

            if (! $result['success']) {
                Log::error('Match payment checkout failed', [
                    'user_id' => $user->id,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Failed to create payment session',
                ], 400);
            }

            // Create payment record
            $payment = Payment::create([
                'user_id' => $user->id,
                'contract_id' => null,
                'payment_type' => Payment::TYPE_MATCH_REQUEST,
                'amount' => $amount,
                'currency' => 'PHP',
                'description' => $description,
                'paymongo_checkout_id' => $result['checkout_id'],
                'paymongo_checkout_url' => $result['checkout_url'],
                'status' => Payment::STATUS_AWAITING_PAYMENT,
                'expires_at' => $result['expires_at'] ? \Carbon\Carbon::parse($result['expires_at']) : now()->addHour(),
                'metadata' => [
                    'requester_pet_id' => $validated['requester_pet_id'],
                    'target_pet_id' => $validated['target_pet_id'],
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment checkout created successfully',
                'data' => [
                    'payment_id' => $payment->id,
                    'checkout_url' => $result['checkout_url'],
                    'expires_at' => $payment->expires_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Match payment exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request',
            ], 500);
        }
    }

    /**
     * Get incoming match requests for user's pets
     */
    public function incoming(Request $request)
    {
        $user = $request->user();

        // Get all pet IDs owned by the user
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get incoming pending requests
        $requests = MatchRequest::whereIn('target_pet_id', $userPetIds)
            ->where('status', 'pending')
            ->with([
                'requesterPet' => function ($query) {
                    $query->with(['owner:id,name,profile_image', 'photos']);
                },
                'targetPet' => function ($query) {
                    $query->with('photos');
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $formattedRequests = $requests->map(function ($request) {
            $primaryPhoto = $request->requesterPet->photos->firstWhere('is_primary', true)
                ?? $request->requesterPet->photos->first();

            return [
                'id' => $request->id,
                'requester_pet' => [
                    'pet_id' => $request->requesterPet->pet_id,
                    'name' => $request->requesterPet->name,
                    'breed' => $request->requesterPet->breed,
                    'photo_url' => $primaryPhoto?->photo_url,
                ],
                'target_pet' => [
                    'pet_id' => $request->targetPet->pet_id,
                    'name' => $request->targetPet->name,
                ],
                'owner' => [
                    'id' => $request->requesterPet->owner->id,
                    'name' => $request->requesterPet->owner->name,
                    'profile_image' => $request->requesterPet->owner->profile_image,
                ],
                'status' => $request->status,
                'created_at' => $request->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedRequests,
        ]);
    }

    /**
     * Get outgoing match requests from user's pets
     */
    public function outgoing(Request $request)
    {
        $user = $request->user();

        // Get all pet IDs owned by the user
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get outgoing requests
        $requests = MatchRequest::whereIn('requester_pet_id', $userPetIds)
            ->with([
                'requesterPet' => function ($query) {
                    $query->with('photos');
                },
                'targetPet' => function ($query) {
                    $query->with(['owner:id,name,profile_image', 'photos']);
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $formattedRequests = $requests->map(function ($request) {
            $primaryPhoto = $request->targetPet->photos->firstWhere('is_primary', true)
                ?? $request->targetPet->photos->first();

            return [
                'id' => $request->id,
                'requester_pet' => [
                    'pet_id' => $request->requesterPet->pet_id,
                    'name' => $request->requesterPet->name,
                ],
                'target_pet' => [
                    'pet_id' => $request->targetPet->pet_id,
                    'name' => $request->targetPet->name,
                    'breed' => $request->targetPet->breed,
                    'photo_url' => $primaryPhoto?->photo_url,
                ],
                'owner' => [
                    'id' => $request->targetPet->owner->id,
                    'name' => $request->targetPet->owner->name,
                    'profile_image' => $request->targetPet->owner->profile_image,
                ],
                'status' => $request->status,
                'created_at' => $request->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedRequests,
        ]);
    }

    /**
     * Get accepted matches for user's pets
     */
    public function matches(Request $request)
    {
        $user = $request->user();

        // Get all pet IDs owned by the user
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get accepted matches where user is either requester or target
        $requests = MatchRequest::where('status', 'accepted')
            ->where(function ($query) use ($userPetIds) {
                $query->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            })
            ->with([
                'requesterPet' => function ($query) {
                    $query->with(['owner:id,name,profile_image', 'photos']);
                },
                'targetPet' => function ($query) {
                    $query->with(['owner:id,name,profile_image', 'photos']);
                },
                'conversation' => function ($query) {
                    $query->with('breedingContract');
                },
            ])
            ->orderBy('updated_at', 'desc')
            ->get();

        $formattedRequests = $requests->map(function ($request) use ($userPetIds) {
            // Determine which pet is the user's and which is the other
            $isRequester = $userPetIds->contains($request->requester_pet_id);
            $userPet = $isRequester ? $request->requesterPet : $request->targetPet;
            $otherPet = $isRequester ? $request->targetPet : $request->requesterPet;

            $primaryPhoto = $otherPet->photos->firstWhere('is_primary', true)
                ?? $otherPet->photos->first();

            // Check if there's a pending shooter request for this match's contract
            $hasPendingShooterRequest = false;
            if ($request->conversation) {
                $contract = $request->conversation->breedingContract;
                if (
                    $contract &&
                    $contract->status === 'accepted' &&
                    $contract->shooter_status === 'accepted_by_shooter'
                ) {
                    // Check if current user hasn't accepted the shooter yet
                    if ($isRequester && ! $contract->owner1_accepted_shooter) {
                        $hasPendingShooterRequest = true;
                    } elseif (! $isRequester && ! $contract->owner2_accepted_shooter) {
                        $hasPendingShooterRequest = true;
                    }
                }
            }

            return [
                'id' => $request->id,
                'conversation_id' => $request->conversation?->id,
                'user_pet' => [
                    'pet_id' => $userPet->pet_id,
                    'name' => $userPet->name,
                ],
                'matched_pet' => [
                    'pet_id' => $otherPet->pet_id,
                    'name' => $otherPet->name,
                    'breed' => $otherPet->breed,
                    'photo_url' => $primaryPhoto?->photo_url,
                ],
                'owner' => [
                    'id' => $otherPet->owner->id,
                    'name' => $otherPet->owner->name,
                    'profile_image' => $otherPet->owner->profile_image,
                ],
                'status' => $request->status,
                'matched_at' => $request->updated_at,
                'has_pending_shooter_request' => $hasPendingShooterRequest,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedRequests,
        ]);
    }

    /**
     * Accept a match request
     */
    public function accept(Request $request, $id)
    {
        $user = $request->user();

        // Get the match request
        $matchRequest = MatchRequest::findOrFail($id);

        // Verify the user owns the target pet
        $targetPet = Pet::where('pet_id', $matchRequest->target_pet_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $targetPet) {
            return response()->json([
                'success' => false,
                'message' => 'You can only accept match requests for your own pets',
            ], 403);
        }

        if ($matchRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This match request has already been processed',
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Update the match request status
            $matchRequest->update(['status' => 'accepted']);

            // Create a conversation
            $conversation = Conversation::create([
                'match_request_id' => $matchRequest->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Match request accepted',
                'data' => [
                    'match_request' => $matchRequest->load(['requesterPet', 'targetPet']),
                    'conversation_id' => $conversation->id,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept match request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Decline a match request
     */
    public function decline(Request $request, $id)
    {
        $user = $request->user();

        // Get the match request
        $matchRequest = MatchRequest::findOrFail($id);

        // Verify the user owns the target pet
        $targetPet = Pet::where('pet_id', $matchRequest->target_pet_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $targetPet) {
            return response()->json([
                'success' => false,
                'message' => 'You can only decline match requests for your own pets',
            ], 403);
        }

        if ($matchRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This match request has already been processed',
            ], 400);
        }

        try {
            $matchRequest->update(['status' => 'declined']);

            return response()->json([
                'success' => true,
                'message' => 'Match request declined',
                'data' => $matchRequest,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline match request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's conversations
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();

        // Get all pet IDs owned by the user
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Debug logging
        \Log::info('Getting conversations for user', [
            'user_id' => $user->id,
            'user_pet_ids' => $userPetIds->toArray(),
        ]);

        // Get conversations where user is part of the match OR is the assigned shooter
        $conversations = Conversation::where(function ($query) use ($userPetIds) {
            // User is an owner (has a pet in the match request)
            $query->whereHas('matchRequest', function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })
            ->orWhere('shooter_user_id', $user->id)
            ->with([
                'matchRequest' => function ($query) {
                    $query->with([
                        'requesterPet' => function ($q) {
                            $q->with(['owner:id,name,profile_image', 'photos']);
                        },
                        'targetPet' => function ($q) {
                            $q->with(['owner:id,name,profile_image', 'photos']);
                        },
                    ]);
                },
                'lastMessage',
                'shooter:id,name,profile_image',
            ])
            ->get();

        // Debug logging
        \Log::info('Found conversations', [
            'count' => $conversations->count(),
            'conversation_ids' => $conversations->pluck('id')->toArray(),
            'shooter_conversations' => $conversations->filter(function ($conv) use ($user) {
                return $conv->shooter_user_id === $user->id;
            })->pluck('id')->toArray(),
        ]);

        $formattedConversations = $conversations->map(function ($conversation) use ($user, $userPetIds) {
            $matchRequest = $conversation->matchRequest;
            $isRequester = $userPetIds->contains($matchRequest->requester_pet_id);
            $isTarget = $userPetIds->contains($matchRequest->target_pet_id);
            $isShooter = $conversation->shooter_user_id === $user->id;

            // Determine status and archived flag
            $status = $conversation->status ?? 'active';
            $isArchived = in_array($status, ['archived', 'completed']);

            // For shooter, show both pets and owners
            if ($isShooter && ! $isRequester && ! $isTarget) {
                $pet1 = $matchRequest->requesterPet;
                $pet2 = $matchRequest->targetPet;
                $pet1Photo = $pet1->photos->firstWhere('is_primary', true) ?? $pet1->photos->first();
                $pet2Photo = $pet2->photos->firstWhere('is_primary', true) ?? $pet2->photos->first();

                // Count unread messages
                $unreadCount = Message::where('conversation_id', $conversation->id)
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->count();

                return [
                    'id' => $conversation->id,
                    'is_shooter_conversation' => true,
                    'status' => $status,
                    'archived' => $isArchived,
                    'archived_at' => $conversation->archived_at?->toIso8601String(),
                    'pet1' => [
                        'pet_id' => $pet1->pet_id,
                        'name' => $pet1->name,
                        'breed' => $pet1->breed,
                        'photo_url' => $pet1Photo?->photo_url,
                    ],
                    'pet2' => [
                        'pet_id' => $pet2->pet_id,
                        'name' => $pet2->name,
                        'breed' => $pet2->breed,
                        'photo_url' => $pet2Photo?->photo_url,
                    ],
                    'owner1' => [
                        'id' => $pet1->owner->id,
                        'name' => $pet1->owner->name,
                        'profile_image' => $pet1->owner->profile_image,
                    ],
                    'owner2' => [
                        'id' => $pet2->owner->id,
                        'name' => $pet2->owner->name,
                        'profile_image' => $pet2->owner->profile_image,
                    ],
                    'last_message' => $conversation->lastMessage ? [
                        'content' => $conversation->lastMessage->content,
                        'created_at' => $conversation->lastMessage->created_at,
                        'is_own' => $conversation->lastMessage->sender_id === $user->id,
                    ] : null,
                    'unread_count' => $unreadCount,
                    'updated_at' => $conversation->lastMessage?->created_at ?? $conversation->created_at,
                ];
            }

            // For owners, use existing logic
            $userPet = $isRequester ? $matchRequest->requesterPet : $matchRequest->targetPet;
            $otherPet = $isRequester ? $matchRequest->targetPet : $matchRequest->requesterPet;

            $primaryPhoto = $otherPet->photos->firstWhere('is_primary', true)
                ?? $otherPet->photos->first();

            // Count unread messages
            $unreadCount = Message::where('conversation_id', $conversation->id)
                ->where('sender_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count();

            return [
                'id' => $conversation->id,
                'is_shooter_conversation' => false,
                'status' => $status,
                'archived' => $isArchived,
                'archived_at' => $conversation->archived_at?->toIso8601String(),
                'matched_pet' => [
                    'pet_id' => $otherPet->pet_id,
                    'name' => $otherPet->name,
                    'breed' => $otherPet->breed,
                    'photo_url' => $primaryPhoto?->photo_url,
                ],
                'owner' => [
                    'id' => $otherPet->owner->id,
                    'name' => $otherPet->owner->name,
                    'profile_image' => $otherPet->owner->profile_image,
                ],
                'shooter' => $conversation->shooter ? [
                    'id' => $conversation->shooter->id,
                    'name' => $conversation->shooter->name,
                    'profile_image' => $conversation->shooter->profile_image,
                ] : null,
                'last_message' => $conversation->lastMessage ? [
                    'content' => $conversation->lastMessage->content,
                    'created_at' => $conversation->lastMessage->created_at,
                    'is_own' => $conversation->lastMessage->sender_id === $user->id,
                ] : null,
                'unread_count' => $unreadCount,
                'updated_at' => $conversation->lastMessage?->created_at ?? $conversation->created_at,
            ];
        })->sortByDesc('updated_at')->values();

        return response()->json([
            'success' => true,
            'data' => $formattedConversations,
        ]);
    }

    /**
     * Get messages for a conversation
     */
    public function getMessages(Request $request, $id)
    {
        $user = $request->user();

        // Get all pet IDs owned by the user
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the conversation and verify user has access (as owner or shooter)
        $conversation = Conversation::where('id', $id)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->firstOrFail();

        // Mark messages as read
        Message::where('conversation_id', $id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Get messages
        $messages = Message::where('conversation_id', $id)
            ->with('sender:id,name,profile_image')
            ->orderBy('created_at', 'asc')
            ->get();

        $formattedMessages = $messages->map(function ($message) use ($user) {
            return [
                'id' => $message->id,
                'content' => $message->content,
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name,
                    'profile_image' => $message->sender->profile_image,
                ],
                'is_own' => $message->sender_id === $user->id,
                'read_at' => $message->read_at,
                'created_at' => $message->created_at,
            ];
        });

        // Get conversation details
        $matchRequest = $conversation->matchRequest()->with([
            'requesterPet' => function ($q) {
                $q->with(['owner:id,name,profile_image', 'photos']);
            },
            'targetPet' => function ($q) {
                $q->with(['owner:id,name,profile_image', 'photos']);
            },
        ])->first();

        $isRequester = $userPetIds->contains($matchRequest->requester_pet_id);
        $isTarget = $userPetIds->contains($matchRequest->target_pet_id);
        $isShooter = $conversation->shooter_user_id === $user->id;

        // For shooter view, show both pets
        if ($isShooter && ! $isRequester && ! $isTarget) {
            $pet1 = $matchRequest->requesterPet;
            $pet2 = $matchRequest->targetPet;
            $pet1Photo = $pet1->photos->firstWhere('is_primary', true) ?? $pet1->photos->first();
            $pet2Photo = $pet2->photos->firstWhere('is_primary', true) ?? $pet2->photos->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'conversation_id' => $conversation->id,
                    'is_shooter_view' => true,
                    'pet1' => [
                        'pet_id' => $pet1->pet_id,
                        'name' => $pet1->name,
                        'photo_url' => $pet1Photo?->photo_url,
                    ],
                    'pet2' => [
                        'pet_id' => $pet2->pet_id,
                        'name' => $pet2->name,
                        'photo_url' => $pet2Photo?->photo_url,
                    ],
                    'owner1' => [
                        'id' => $pet1->owner->id,
                        'name' => $pet1->owner->name,
                        'profile_image' => $pet1->owner->profile_image,
                    ],
                    'owner2' => [
                        'id' => $pet2->owner->id,
                        'name' => $pet2->owner->name,
                        'profile_image' => $pet2->owner->profile_image,
                    ],
                    'messages' => $formattedMessages,
                ],
            ]);
        }

        $otherPet = $isRequester ? $matchRequest->targetPet : $matchRequest->requesterPet;

        $primaryPhoto = $otherPet->photos->firstWhere('is_primary', true)
            ?? $otherPet->photos->first();

        return response()->json([
            'success' => true,
            'data' => [
                'conversation_id' => $conversation->id,
                'is_shooter_view' => false,
                'matched_pet' => [
                    'pet_id' => $otherPet->pet_id,
                    'name' => $otherPet->name,
                    'photo_url' => $primaryPhoto?->photo_url,
                ],
                'owner' => [
                    'id' => $otherPet->owner->id,
                    'name' => $otherPet->owner->name,
                    'profile_image' => $otherPet->owner->profile_image,
                ],
                'shooter' => $conversation->shooter_user_id ? [
                    'id' => $conversation->shooter->id ?? null,
                    'name' => $conversation->shooter->name ?? null,
                    'profile_image' => $conversation->shooter->profile_image ?? null,
                ] : null,
                'messages' => $formattedMessages,
            ],
        ]);
    }

    /**
     * Send a message in a conversation
     */
    public function sendMessage(Request $request, $id)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        // Get all pet IDs owned by the user
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Get the conversation and verify user has access (as owner or shooter)
        $conversation = Conversation::where('id', $id)
            ->where(function ($query) use ($userPetIds, $user) {
                $query->whereHas('matchRequest', function ($q) use ($userPetIds) {
                    $q->whereIn('requester_pet_id', $userPetIds)
                        ->orWhereIn('target_pet_id', $userPetIds);
                })
                    ->orWhere('shooter_user_id', $user->id);
            })
            ->firstOrFail();

        try {
            $message = Message::create([
                'conversation_id' => $id,
                'sender_id' => $user->id,
                'content' => $validated['content'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => [
                    'id' => $message->id,
                    'content' => $message->content,
                    'sender' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'profile_image' => $user->profile_image,
                    ],
                    'is_own' => true,
                    'read_at' => null,
                    'created_at' => $message->created_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
