<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserReview extends Model
{
    protected $fillable = [
        'reviewer_id',
        'subject_id',
        'match_id',
        'rating',
        'comment',
    ];

    /**
     * Get the user giving the review
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Get the user being reviewed
     */
    public function subject()
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    /**
     * Get the match associated with the review
     */
    public function match()
    {
        return $this->belongsTo(MatchRequest::class, 'match_id');
    }
}
