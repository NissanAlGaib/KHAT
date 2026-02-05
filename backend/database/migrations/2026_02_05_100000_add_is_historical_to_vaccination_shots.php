<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds is_historical flag to vaccination_shots table and updates
     * verification_status ENUM to include 'historical' value.
     */
    public function up(): void
    {
        // First, modify the verification_status ENUM to include 'historical'
        DB::statement("ALTER TABLE vaccination_shots MODIFY COLUMN verification_status ENUM('pending', 'approved', 'rejected', 'historical') DEFAULT 'pending'");

        // Then add the is_historical column
        Schema::table('vaccination_shots', function (Blueprint $table) {
            if (!Schema::hasColumn('vaccination_shots', 'is_historical')) {
                $table->boolean('is_historical')->default(false)->after('verification_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccination_shots', function (Blueprint $table) {
            if (Schema::hasColumn('vaccination_shots', 'is_historical')) {
                $table->dropColumn('is_historical');
            }
        });

        // Revert the ENUM (only if no historical records exist)
        DB::statement("ALTER TABLE vaccination_shots MODIFY COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
    }
};
