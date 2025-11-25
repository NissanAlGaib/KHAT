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
        // Update vaccinations table
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('status');
        });

        // Update the status enum for vaccinations
        DB::statement("ALTER TABLE vaccinations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'verified', 'expired') DEFAULT 'pending'");

        // Update health_records table
        Schema::table('health_records', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('status');
        });

        // Update the status enum for health_records
        DB::statement("ALTER TABLE health_records MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'verified', 'expired') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });

        DB::statement("ALTER TABLE vaccinations MODIFY COLUMN status ENUM('verified', 'pending', 'expired') DEFAULT 'pending'");

        Schema::table('health_records', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });

        DB::statement("ALTER TABLE health_records MODIFY COLUMN status ENUM('verified', 'pending', 'expired') DEFAULT 'pending'");
    }
};
