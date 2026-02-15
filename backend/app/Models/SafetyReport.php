<?php

namespace App\Models;

use App\Traits\TracksUpdates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafetyReport extends Model
{
    use TracksUpdates;

    public const REASON_HARASSMENT = 'harassment';
    public const REASON_SCAM = 'scam';
    public const REASON_INAPPROPRIATE = 'inappropriate';
    public const REASON_FAKE_PROFILE = 'fake_profile';
    public const REASON_OTHER = 'other';

    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_DISMISSED = 'dismissed';

    public const ACTION_NONE = 'none';
    public const ACTION_WARNING = 'warning';
    public const ACTION_BAN = 'ban';

    protected $fillable = [
        'reporter_id',
        'reported_id',
        'reason',
        'description',
        'status',
        'admin_notes',
        'resolution_action',
        'reviewed_by',
        'reviewed_at',
        'updated_by',
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

    /**
     * Get valid report reasons from config.
     */
    public static function getValidReasons(): array
    {
        return array_keys(config('safety.report_reasons', [
            'harassment' => 'Harassment',
            'scam' => 'Scam or Fraud',
            'inappropriate' => 'Inappropriate Content',
            'fake_profile' => 'Fake Profile',
            'other' => 'Other',
        ]));
    }

    /**
     * Get report reasons with labels from config.
     */
    public static function getReasonLabels(): array
    {
        return config('safety.report_reasons', [
            'harassment' => 'Harassment',
            'scam' => 'Scam or Fraud',
            'inappropriate' => 'Inappropriate Content',
            'fake_profile' => 'Fake Profile',
            'other' => 'Other',
        ]);
    }

    /**
     * Get human-readable label for a reason.
     */
    public static function getReasonLabel(string $reason): string
    {
        $labels = static::getReasonLabels();
        return $labels[$reason] ?? ucfirst(str_replace('_', ' ', $reason));
    }
}
