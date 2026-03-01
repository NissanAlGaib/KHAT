<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Converts subscription_tier from ENUM to VARCHAR so that dynamically-created
     * subscription tiers (via the admin Subscription Tiers manager) work without
     * needing a migration every time a new tier is added.
     * 
     * Also migrates any legacy 'standard' values to 'basic' to match the current
     * subscription_tiers table data.
     */
    public function up(): void
    {
        // Convert ENUM to VARCHAR(50) — supports any tier slug from subscription_tiers table
        DB::statement("ALTER TABLE users MODIFY COLUMN subscription_tier VARCHAR(50) DEFAULT 'free'");

        // Migrate legacy 'standard' records to 'basic' to match subscription_tiers table
        DB::table('users')->where('subscription_tier', 'standard')->update(['subscription_tier' => 'basic']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Migrate 'basic' back to 'standard' before re-applying ENUM constraint
        DB::table('users')->where('subscription_tier', 'basic')->update(['subscription_tier' => 'standard']);

        // Revert to original ENUM
        DB::statement("ALTER TABLE users MODIFY COLUMN subscription_tier ENUM('free', 'standard', 'premium') DEFAULT 'free'");
    }
};
