<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserReview;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class UserReviewController extends Controller
{
    /**
     * Display a listing of user reviews.
     */
    public function index(Request $request)
    {
        $query = UserReview::with(['reviewer', 'subject', 'match']);

        // Filter by rating
        if ($request->filled('rating')) {
            $query->where('rating', $request->rating);
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

        // Date filtering (using manual check since model might not have trait yet)
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate(15)->appends($request->query());

        return view('admin.reviews.index', compact('reviews'));
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
