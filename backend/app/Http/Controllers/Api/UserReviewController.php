<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BreedingContract;
use App\Models\MatchRequest;
use App\Models\ReviewRating;
use App\Models\UserReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserReviewController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Breeder Review — POST /api/match-requests/{match}/review
    |--------------------------------------------------------------------------
    */

    /**
     * Store a new category-based review for a completed match (breeder → breeder).
     */
    public function store(Request $request, MatchRequest $match)
    {
        $user = Auth::user();

        // 1. Authorization & Status Checks
        $requesterOwnerId = $match->requesterPet->user_id;
        $targetOwnerId    = $match->targetPet->user_id;

        if ($user->id !== $requesterOwnerId && $user->id !== $targetOwnerId) {
            return response()->json(['message' => 'You are not authorized to review this match.'], 403);
        }

        if ($match->status !== 'completed') {
            return response()->json(['message' => 'Only completed matches can be reviewed.'], 403);
        }

        // 2. Check if already reviewed
        if ($match->reviews()->where('reviewer_id', $user->id)->where('review_type', 'breeder')->exists()) {
            return response()->json(['message' => 'You have already reviewed this match.'], 422);
        }

        // 3. Validation — category-based ratings
        $breederCategories = array_keys(config('ratings.breeder_categories', []));
        $min = config('ratings.min_rating', 0.5);
        $max = config('ratings.max_rating', 5.0);

        $rules = [
            'ratings'   => 'required|array|min:1',
            'comment'   => 'nullable|string|max:1000',
        ];
        foreach ($breederCategories as $cat) {
            $rules["ratings.{$cat}"] = "sometimes|numeric|min:{$min}|max:{$max}";
        }

        $validated = $request->validate($rules);

        // Filter only valid categories
        $ratings = collect($validated['ratings'])
            ->only($breederCategories)
            ->filter(fn($v) => $v !== null);

        if ($ratings->isEmpty()) {
            return response()->json(['message' => 'At least one category rating is required.'], 422);
        }

        // Validate half-star increments
        $step = config('ratings.step', 0.5);
        foreach ($ratings as $cat => $value) {
            if (fmod(round($value, 1), $step) != 0) {
                return response()->json([
                    'message' => "Rating for {$cat} must be in {$step} increments.",
                ], 422);
            }
        }

        // 4. Determine Subject (the other user)
        $subjectId = ($user->id === $requesterOwnerId) ? $targetOwnerId : $requesterOwnerId;
        $subject   = User::findOrFail($subjectId);

        // 5. Create Review + Category Ratings
        $review = DB::transaction(function () use ($user, $subjectId, $match, $validated, $ratings) {
            $review = UserReview::create([
                'reviewer_id'    => $user->id,
                'subject_id'     => $subjectId,
                'match_id'       => $match->id,
                'review_type'    => 'breeder',
                'comment'        => $validated['comment'] ?? null,
            ]);

            foreach ($ratings as $category => $value) {
                ReviewRating::create([
                    'user_review_id' => $review->id,
                    'category'       => $category,
                    'rating'         => round($value, 1),
                ]);
            }

            $review->recalculateAverage();

            return $review;
        });

        // 6. Recalculate Subject's Rating
        $subject->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
            'review'  => $review->load('ratings'),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Shooter Review — POST /api/contracts/{contract}/review-shooter
    |--------------------------------------------------------------------------
    */

    /**
     * Both pet owners can rate the assigned shooter after match completion.
     */
    public function storeShooterReview(Request $request, BreedingContract $contract)
    {
        $user = Auth::user();

        // 1. Must be one of the two pet owners
        $owner1Id = $contract->conversation->matchRequest->requesterPet->user_id ?? null;
        $owner2Id = $contract->conversation->matchRequest->targetPet->user_id ?? null;

        if ($user->id !== $owner1Id && $user->id !== $owner2Id) {
            return response()->json(['message' => 'Only the pet owners can review the shooter.'], 403);
        }

        // 2. Contract must have a shooter and be fulfilled / match completed
        if (!$contract->shooter_user_id) {
            return response()->json(['message' => 'No shooter assigned to this contract.'], 404);
        }

        $matchRequest = $contract->conversation->matchRequest;
        if ($matchRequest->status !== 'completed') {
            return response()->json(['message' => 'The match must be completed before reviewing the shooter.'], 403);
        }

        // 3. Already reviewed?
        $existing = UserReview::where('reviewer_id', $user->id)
            ->where('subject_id', $contract->shooter_user_id)
            ->where('contract_id', $contract->id)
            ->where('review_type', 'shooter')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed the shooter for this contract.'], 422);
        }

        // 4. Validate
        $shooterCategories = array_keys(config('ratings.shooter_categories', []));
        $min = config('ratings.min_rating', 0.5);
        $max = config('ratings.max_rating', 5.0);

        $rules = [
            'ratings' => 'required|array|min:1',
            'comment' => 'nullable|string|max:1000',
        ];
        foreach ($shooterCategories as $cat) {
            $rules["ratings.{$cat}"] = "sometimes|numeric|min:{$min}|max:{$max}";
        }

        $validated = $request->validate($rules);

        $ratings = collect($validated['ratings'])
            ->only($shooterCategories)
            ->filter(fn($v) => $v !== null);

        if ($ratings->isEmpty()) {
            return response()->json(['message' => 'At least one category rating is required.'], 422);
        }

        $step = config('ratings.step', 0.5);
        foreach ($ratings as $cat => $value) {
            if (fmod(round($value, 1), $step) != 0) {
                return response()->json([
                    'message' => "Rating for {$cat} must be in {$step} increments.",
                ], 422);
            }
        }

        // 5. Create
        $shooter = User::findOrFail($contract->shooter_user_id);

        $review = DB::transaction(function () use ($user, $shooter, $contract, $matchRequest, $validated, $ratings) {
            $review = UserReview::create([
                'reviewer_id' => $user->id,
                'subject_id'  => $shooter->id,
                'match_id'    => $matchRequest->id,
                'contract_id' => $contract->id,
                'review_type' => 'shooter',
                'comment'     => $validated['comment'] ?? null,
            ]);

            foreach ($ratings as $category => $value) {
                ReviewRating::create([
                    'user_review_id' => $review->id,
                    'category'       => $category,
                    'rating'         => round($value, 1),
                ]);
            }

            $review->recalculateAverage();

            return $review;
        });

        $shooter->recalculateShooterRating();

        return response()->json([
            'success' => true,
            'message' => 'Shooter review submitted successfully.',
            'review'  => $review->load('ratings'),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Shooter rates Breeder — POST /api/contracts/{contract}/review-breeder
    |--------------------------------------------------------------------------
    */

    /**
     * Shooter can rate each pet owner after match completion.
     */
    public function storeBreederReviewAsShooter(Request $request, BreedingContract $contract)
    {
        $user = Auth::user();

        // Must be the assigned shooter
        if ($user->id !== $contract->shooter_user_id) {
            return response()->json(['message' => 'Only the assigned shooter can submit this review.'], 403);
        }

        $matchRequest = $contract->conversation->matchRequest;
        if ($matchRequest->status !== 'completed') {
            return response()->json(['message' => 'The match must be completed before reviewing.'], 403);
        }

        // Validate target breeder
        $owner1Id = $matchRequest->requesterPet->user_id;
        $owner2Id = $matchRequest->targetPet->user_id;

        $request->validate([
            'subject_id' => 'required|integer',
            'ratings'    => 'required|array|min:1',
            'comment'    => 'nullable|string|max:1000',
        ]);

        $subjectId = $request->input('subject_id');

        if ($subjectId !== $owner1Id && $subjectId !== $owner2Id) {
            return response()->json(['message' => 'The subject must be one of the pet owners in this contract.'], 422);
        }

        // Already reviewed?
        $existing = UserReview::where('reviewer_id', $user->id)
            ->where('subject_id', $subjectId)
            ->where('contract_id', $contract->id)
            ->where('review_type', 'breeder')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this breeder for this contract.'], 422);
        }

        $breederCategories = array_keys(config('ratings.breeder_categories', []));
        $min = config('ratings.min_rating', 0.5);
        $max = config('ratings.max_rating', 5.0);

        $rules = [];
        foreach ($breederCategories as $cat) {
            $rules["ratings.{$cat}"] = "sometimes|numeric|min:{$min}|max:{$max}";
        }
        $request->validate($rules);

        $ratings = collect($request->input('ratings'))
            ->only($breederCategories)
            ->filter(fn($v) => $v !== null);

        if ($ratings->isEmpty()) {
            return response()->json(['message' => 'At least one category rating is required.'], 422);
        }

        $step = config('ratings.step', 0.5);
        foreach ($ratings as $cat => $value) {
            if (fmod(round($value, 1), $step) != 0) {
                return response()->json([
                    'message' => "Rating for {$cat} must be in {$step} increments.",
                ], 422);
            }
        }

        $subject = User::findOrFail($subjectId);

        $review = DB::transaction(function () use ($user, $subjectId, $matchRequest, $contract, $request, $ratings) {
            $review = UserReview::create([
                'reviewer_id' => $user->id,
                'subject_id'  => $subjectId,
                'match_id'    => $matchRequest->id,
                'contract_id' => $contract->id,
                'review_type' => 'breeder',
                'comment'     => $request->input('comment'),
            ]);

            foreach ($ratings as $category => $value) {
                ReviewRating::create([
                    'user_review_id' => $review->id,
                    'category'       => $category,
                    'rating'         => round($value, 1),
                ]);
            }

            $review->recalculateAverage();

            return $review;
        });

        $subject->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'Breeder review submitted successfully.',
            'review'  => $review->load('ratings'),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Review Status — GET /api/match-requests/{match}/review-status
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether the current user has already reviewed for a given match
     * and whether a shooter review exists.
     */
    public function reviewStatus(MatchRequest $match)
    {
        $user = Auth::user();

        $breederReview = $match->reviews()
            ->where('reviewer_id', $user->id)
            ->where('review_type', 'breeder')
            ->first();

        // Find related contract for shooter info
        $contract = BreedingContract::whereHas('conversation', function ($q) use ($match) {
            $q->where('match_request_id', $match->id);
        })->first();

        $hasShooter       = $contract && $contract->shooter_user_id;
        $shooterReviewed  = false;
        $shooterSubjectId = $contract->shooter_user_id ?? null;
        $isShooter        = $hasShooter && $user->id === $contract->shooter_user_id;

        if ($hasShooter && !$isShooter) {
            $shooterReviewed = UserReview::where('reviewer_id', $user->id)
                ->where('subject_id', $contract->shooter_user_id)
                ->where('contract_id', $contract->id)
                ->where('review_type', 'shooter')
                ->exists();
        }

        // If the user is the shooter, check their breeder reviews
        $breederReviewsByShooter = [];
        if ($isShooter && $contract) {
            $owner1Id = $match->requesterPet->user_id;
            $owner2Id = $match->targetPet->user_id;

            foreach ([$owner1Id, $owner2Id] as $ownerId) {
                $breederReviewsByShooter[$ownerId] = UserReview::where('reviewer_id', $user->id)
                    ->where('subject_id', $ownerId)
                    ->where('contract_id', $contract->id)
                    ->where('review_type', 'breeder')
                    ->exists();
            }
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'breeder_reviewed'          => (bool) $breederReview,
                'breeder_review'            => $breederReview?->load('ratings'),
                'has_shooter'               => $hasShooter,
                'shooter_user_id'           => $shooterSubjectId,
                'shooter_reviewed'          => $shooterReviewed,
                'is_shooter'                => $isShooter,
                'breeder_reviews_by_shooter' => $breederReviewsByShooter,
                'contract_id'               => $contract?->id,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | User Reviews — GET /api/users/{user}/reviews
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated reviews for a user with category breakdowns.
     */
    public function userReviews(User $user, Request $request)
    {
        $type = $request->query('type', 'breeder'); // breeder or shooter

        $reviews = UserReview::with(['ratings', 'reviewer:id,name,profile_image'])
            ->where('subject_id', $user->id)
            ->where('review_type', $type)
            ->whereNotNull('average_rating')
            ->orderByDesc('created_at')
            ->paginate(15);

        // Category averages
        $categoryKey = $type === 'shooter' ? 'shooter_categories' : 'breeder_categories';
        $categories  = config("ratings.{$categoryKey}", []);

        $categoryAverages = [];
        foreach (array_keys($categories) as $cat) {
            $avg = ReviewRating::whereHas('review', function ($q) use ($user, $type) {
                $q->where('subject_id', $user->id)->where('review_type', $type);
            })->where('category', $cat)->avg('rating');

            $categoryAverages[$cat] = [
                'label'   => $categories[$cat],
                'average' => $avg ? round($avg, 1) : null,
                'count'   => ReviewRating::whereHas('review', function ($q) use ($user, $type) {
                    $q->where('subject_id', $user->id)->where('review_type', $type);
                })->where('category', $cat)->count(),
            ];
        }

        $overallAvg   = $type === 'shooter' ? $user->shooter_average_rating : $user->average_rating;
        $reviewCount  = $type === 'shooter' ? $user->shooter_review_count : $user->review_count;

        return response()->json([
            'success' => true,
            'data'    => [
                'overall_average'    => (float) $overallAvg,
                'review_count'       => $reviewCount,
                'category_averages'  => $categoryAverages,
                'categories'         => $categories,
                'reviews'            => $reviews,
            ],
        ]);
    }
}
