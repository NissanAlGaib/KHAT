<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait TracksUpdates
{
    public static function bootTracksUpdates()
    {
        static::updating(function (Model $model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        static::creating(function (Model $model) {
            // Usually updated_by is null on creation, or same as created_by if that exists.
            // Let's leave it null on creation unless explicitly set, or set it to creator.
            // User requested "who updated it", so initially null or same as creator?
            // "Updated" implies a change *after* creation.
            // Standard practice: created_by = user, updated_by = user (or null).
            // Let's set it to Auth::id() so we know who "last touched" it, even on creation?
            // No, standard Laravel timestamps: created_at == updated_at on create.
            // So let's populate it.
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
