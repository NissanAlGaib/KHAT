<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration fixes any existing accepted contracts with shooter payment
     * that don't have shooter_status set to 'pending'
     */
    public function up(): void
    {
        // Log current state before fix
        $before = DB::table('breeding_contracts')
            ->where('status', 'accepted')
            ->whereNotNull('shooter_payment')
            ->where('shooter_payment', '>', 0)
            ->get(['id', 'status', 'shooter_status', 'shooter_payment']);
        
        Log::info('Fix migration - before state', ['contracts' => $before->toArray()]);
        
        // Update all accepted contracts with shooter payment > 0 to have pending status
        // Only update if shooter_status is currently 'none' or null
        $updated = DB::table('breeding_contracts')
            ->where('status', 'accepted')
            ->whereNotNull('shooter_payment')
            ->where('shooter_payment', '>', 0)
            ->where(function ($query) {
                $query->where('shooter_status', 'none')
                      ->orWhereNull('shooter_status');
            })
            ->update(['shooter_status' => 'pending']);
        
        Log::info('Fix migration - updated ' . $updated . ' contracts to shooter_status=pending');
        
        // Log state after fix
        $after = DB::table('breeding_contracts')
            ->where('status', 'accepted')
            ->whereNotNull('shooter_payment')
            ->where('shooter_payment', '>', 0)
            ->get(['id', 'status', 'shooter_status', 'shooter_payment']);
        
        Log::info('Fix migration - after state', ['contracts' => $after->toArray()]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is a one-way fix, no need to reverse
    }
};
