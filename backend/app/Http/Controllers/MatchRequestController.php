<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\MatchRequest;
use App\Models\Message;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchRequestController extends Controller
{
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

        if (!$requesterPet) {
            return response()->json([
                'success' => false,
                'message' => 'You can only send match requests from your own pets',
            ], 403);
        }

        // Verify the target pet doesn't belong to the authenticated user
        $targetPet = Pet::where('pet_id', $validated['target_pet_id'])->first();

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
                'conversation',
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

        if (!$targetPet) {
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

        if (!$targetPet) {
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

        // Get conversations where user is part of the match
        $conversations = Conversation::whereHas('matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })
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
            ])
            ->get();

        $formattedConversations = $conversations->map(function ($conversation) use ($user, $userPetIds) {
            $matchRequest = $conversation->matchRequest;
            $isRequester = $userPetIds->contains($matchRequest->requester_pet_id);
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

        // Get the conversation and verify user has access
        $conversation = Conversation::whereHas('matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->findOrFail($id);

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
        $otherPet = $isRequester ? $matchRequest->targetPet : $matchRequest->requesterPet;

        $primaryPhoto = $otherPet->photos->firstWhere('is_primary', true)
            ?? $otherPet->photos->first();

        return response()->json([
            'success' => true,
            'data' => [
                'conversation_id' => $conversation->id,
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

        // Get the conversation and verify user has access
        $conversation = Conversation::whereHas('matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })->findOrFail($id);

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
