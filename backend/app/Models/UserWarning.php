<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWarning extends Model
{
    protected $fillable = [
        'user_id',
        'admin_id',
        'type',
        'message',
        'acknowledged_at',
    ];

    protected function casts(): array
    {
        return [
            'acknowledged_at' => 'datetime',
        ];
    }

    /**
     * Get the user receiving the warning
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the admin issuing the warning
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
