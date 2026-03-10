<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewRating extends Model
{
    protected $fillable = [
        'user_review_id',
        'category',
        'rating',
    ];

    protected $casts = [
        'rating' => 'decimal:1',
    ];

    /**
     * Get the parent review.
     */
    public function review(): BelongsTo
    {
        return $this->belongsTo(UserReview::class, 'user_review_id');
    }
}
