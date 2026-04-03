<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalyticsService
{
    /**
     * Store a monetization event for reporting/auditing.
     */
    public static function track(string $eventName, array $payload = [], ?int $userId = null, ?int $paymentId = null): void
    {
        try {
            DB::table('monetization_events')->insert([
                'user_id' => $userId,
                'payment_id' => $paymentId,
                'event_name' => $eventName,
                'payload' => json_encode($payload),
                'occurred_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Keep payment/subscription flow resilient even if analytics insert fails.
            Log::warning('Failed to persist monetization event', [
                'event_name' => $eventName,
                'user_id' => $userId,
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
