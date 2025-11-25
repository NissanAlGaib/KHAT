<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserAuth extends Model
{
    use HasFactory;

    protected $table = 'user_auth';
    protected $primaryKey = 'auth_id';

    protected $fillable = [
        'user_id',
        'auth_type',
        'document_path',
        'document_number',
        'document_name',
        'issue_date',
        'issuing_authority',
        'expiry_date',
        'status',
        'rejection_reason',
        'date_created',
    ];

    protected $casts = [
        'date_created' => 'datetime',
        'expiry_date' => 'date',
        'issue_date' => 'date',
    ];

    /**
     * Get the user that owns the auth record
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
