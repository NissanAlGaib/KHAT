<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafetyReport extends Model
{
    public const REASON_HARASSMENT = 'harassment';
    public const REASON_SCAM = 'scam';
    public const REASON_INAPPROPRIATE = 'inappropriate';
    public const REASON_FAKE_PROFILE = 'fake_profile';
    public const REASON_OTHER = 'other';

    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_DISMISSED = 'dismissed';

    protected $fillable = [
        'reporter_id',
        'reported_id',
        'reason',
        'description',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reported(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public static function getValidReasons(): array
    {
        return [
            self::REASON_HARASSMENT,
            self::REASON_SCAM,
            self::REASON_INAPPROPRIATE,
            self::REASON_FAKE_PROFILE,
            self::REASON_OTHER,
        ];
    }
}
