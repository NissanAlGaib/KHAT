<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserReview extends Model
{
    protected $fillable = [
        'reviewer_id',
        'subject_id',
        'match_id',
        'contract_id',
        'review_type',
        'average_rating',
        'comment',
    ];

    protected $casts = [
        'average_rating' => 'decimal:1',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the user giving the review.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Get the user being reviewed.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    /**
     * Get the match associated with the review.
     */
    public function match(): BelongsTo
    {
        return $this->belongsTo(MatchRequest::class, 'match_id');
    }

    /**
     * Get the breeding contract associated with the review.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(BreedingContract::class, 'contract_id');
    }

    /**
     * Get the individual category ratings.
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(ReviewRating::class, 'user_review_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Recalculate and cache the average from category ratings.
     */
    public function recalculateAverage(): void
    {
        $avg = $this->ratings()->avg('rating');
        $this->average_rating = $avg ? round($avg, 1) : null;
        $this->save();
    }

    /**
     * Get valid categories for this review's type.
     */
    public function getValidCategories(): array
    {
        $key = $this->review_type === 'shooter' ? 'shooter_categories' : 'breeder_categories';
        return array_keys(config("ratings.{$key}", []));
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeBreeder($query)
    {
        return $query->where('review_type', 'breeder');
    }

    public function scopeShooter($query)
    {
        return $query->where('review_type', 'shooter');
    }
}
