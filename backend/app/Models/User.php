<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Role> $roles
 * @method \Illuminate\Database\Eloquent\Relations\BelongsToMany roles()
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    use HasApiTokens;
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'subscription_tier',
        'firstName',
        'lastName',
        'contact_number',
        'birthdate',
        'sex',
        'address',
        'profile_image',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birthday' => 'date',
            'address' => 'array',
        ];
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id', 'id', 'role_id');
    }

    /**
     * Get the pets owned by the user
     */
    public function pets()
    {
        return $this->hasMany(Pet::class, 'user_id');
    }

    /**
     * Get the pets recommended by the user
     */
    public function recommendedPets()
    {
        return $this->hasMany(Pet::class, 'rec_id');
    }

    /**
     * Get the authentication records for the user
     */
    public function userAuth()
    {
        return $this->hasMany(UserAuth::class, 'user_id', 'id');
    }

    /**
     * Get users blocked by this user
     */
    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocker_id', 'blocked_id')
            ->withTimestamps();
    }

    /**
     * Get users who blocked this user
     */
    public function blockedByUsers()
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocked_id', 'blocker_id')
            ->withTimestamps();
    }

    /**
     * Check if this user has blocked another user
     */
    public function hasBlocked(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_id', $user->id)->exists();
    }

    /**
     * Check if this user is blocked by another user
     */
    public function isBlockedBy(User $user): bool
    {
        return $this->blockedByUsers()->where('blocker_id', $user->id)->exists();
    }

    /**
     * Get all user IDs that should be excluded (blocked by me or blocked me)
     */
    public function getBlockedUserIds(): array
    {
        try {
            $blockedByMe = $this->blockedUsers()->pluck('users.id')->toArray();
            $blockedMe = $this->blockedByUsers()->pluck('users.id')->toArray();
            return array_unique(array_merge($blockedByMe, $blockedMe));
        } catch (\Exception $e) {
            // If the user_blocks table doesn't exist or query fails, return empty array
            return [];
        }
    }
}
