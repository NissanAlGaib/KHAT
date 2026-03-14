<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserReview;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserReviewController extends Controller
{
    /**
     * Display a listing of user reviews.
     */
    public function index(Request $request)
    {
        $query = UserReview::with(['reviewer', 'subject', 'match', 'ratings']);

        // Filter by rating
        if ($request->filled('rating')) {
            $query->where('average_rating', '>=', $request->rating)
                ->where('average_rating', '<', $request->rating + 1);
        }

        // Filter by review type
        if ($request->filled('review_type')) {
            $query->where('review_type', $request->review_type);
        }

        // Search by reviewer or subject name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('reviewer', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })
                    ->orWhereHas('subject', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Date filtering
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $perPage = $request->input('per_page', 15);
        $reviews = $query->orderBy('created_at', 'desc')->paginate($perPage)->appends($request->query());

        // Summary statistics
        $totalReviews = UserReview::count();
        $averageRating = UserReview::whereNotNull('average_rating')->avg('average_rating');
        $positiveReviews = UserReview::where('average_rating', '>=', 4)->count();
        $negativeReviews = UserReview::where('average_rating', '<=', 2)->count();

        // Rating distribution
        $ratingDistribution = UserReview::select(
            DB::raw('FLOOR(average_rating) as star_bucket'),
            DB::raw('COUNT(*) as count')
        )
            ->whereNotNull('average_rating')
            ->groupBy('star_bucket')
            ->orderBy('star_bucket')
            ->pluck('count', 'star_bucket')
            ->toArray();

        // Fill in missing buckets
        for ($i = 1; $i <= 5; $i++) {
            if (!isset($ratingDistribution[$i])) {
                $ratingDistribution[$i] = 0;
            }
        }
        ksort($ratingDistribution);

        // Reviews this month vs last month for trend
        $reviewsThisMonth = UserReview::where('created_at', '>=', now()->startOfMonth())->count();
        $reviewsLastMonth = UserReview::whereBetween('created_at', [
            now()->subMonth()->startOfMonth(),
            now()->subMonth()->endOfMonth()
        ])->count();
        $reviewTrend = $reviewsLastMonth > 0
            ? round((($reviewsThisMonth - $reviewsLastMonth) / $reviewsLastMonth) * 100, 1)
            : ($reviewsThisMonth > 0 ? 100 : 0);

        // Type breakdown
        $breederReviews = UserReview::where('review_type', 'breeder')->count();
        $shooterReviews = UserReview::where('review_type', 'shooter')->count();

        return view('admin.reviews.index', compact(
            'reviews',
            'totalReviews',
            'averageRating',
            'positiveReviews',
            'negativeReviews',
            'ratingDistribution',
            'reviewsThisMonth',
            'reviewTrend',
            'breederReviews',
            'shooterReviews'
        ));
    }

    /**
     * Remove the specified review.
     */
    public function destroy($id)
    {
        $review = UserReview::findOrFail($id);
        $subject = $review->subject;

        $review->delete();

        // Recalculate subject's rating after deletion
        if ($subject) {
            $subject->recalculateRating();
        }

        // Log the action
        AuditLog::log(
            'review.deleted',
            AuditLog::TYPE_DELETE,
            "Admin deleted review #{$id} by {$review->reviewer->name} for {$review->subject->name}",
            UserReview::class,
            $id
        );

        return redirect()->back()->with('success', 'Review deleted successfully.');
    }
}
