<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'completed' status to match_requests
        // First, modify the ENUM to include 'completed'
        DB::statement("ALTER TABLE match_requests MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending'");

        // Add 'fulfilled' status to breeding_contracts
        DB::statement("ALTER TABLE breeding_contracts MODIFY COLUMN status ENUM('draft', 'pending_review', 'accepted', 'rejected', 'fulfilled') DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'completed' status from match_requests
        DB::statement("ALTER TABLE match_requests MODIFY COLUMN status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending'");

        // Remove 'fulfilled' status from breeding_contracts
        DB::statement("ALTER TABLE breeding_contracts MODIFY COLUMN status ENUM('draft', 'pending_review', 'accepted', 'rejected') DEFAULT 'draft'");
    }
};
