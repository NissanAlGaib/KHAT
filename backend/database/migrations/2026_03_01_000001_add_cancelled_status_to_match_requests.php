<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE match_requests MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE match_requests MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending'");
    }
};
