<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\MatchRequest;
use App\Models\UserReview;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserReviewController extends Controller
{
    /**
     * Store a new review for a completed match.
     */
    public function store(Request $request, MatchRequest $match)
    {
        $user = Auth::user();

        // 1. Authorization & Status Checks
        $requesterOwnerId = $match->requesterPet->user_id;
        $targetOwnerId = $match->targetPet->user_id;

        if ($user->id !== $requesterOwnerId && $user->id !== $targetOwnerId) {
            return response()->json(['message' => 'You are not authorized to review this match.'], 403);
        }

        if ($match->status !== 'completed') {
            return response()->json(['message' => 'Only completed matches can be reviewed.'], 403);
        }

        // 2. Check if already reviewed
        if ($match->reviews()->where('reviewer_id', $user->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this match.'], 422);
        }

        // 3. Validation
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // 4. Determine Subject (the other user)
        $subjectId = ($user->id === $requesterOwnerId) ? $targetOwnerId : $requesterOwnerId;
        $subject = User::findOrFail($subjectId);

        // 5. Create Review
        $review = UserReview::create([
            'reviewer_id' => $user->id,
            'subject_id' => $subjectId,
            'match_id' => $match->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        // 6. Recalculate Subject's Rating
        $subject->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
            'review' => $review
        ], 201);
    }
}
