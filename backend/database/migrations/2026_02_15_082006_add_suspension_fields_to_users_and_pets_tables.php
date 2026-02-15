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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['active', 'suspended', 'banned'])->default('active')->after('password');
            }
            if (!Schema::hasColumn('users', 'suspension_reason')) {
                $table->text('suspension_reason')->nullable()->after('status');
            }
            if (!Schema::hasColumn('users', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable()->after('suspension_reason');
            }
        });

        Schema::table('pets', function (Blueprint $table) {
            if (!Schema::hasColumn('pets', 'suspension_reason')) {
                $table->text('suspension_reason')->nullable()->after('status');
            }
            if (!Schema::hasColumn('pets', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable()->after('suspension_reason');
            }
        });

        // Update pets status enum to include 'cooldown' and 'banned'
        // Using raw SQL as changing ENUM options via Schema builder is complex/limited
        DB::statement("ALTER TABLE pets MODIFY COLUMN status ENUM('active', 'disabled', 'pending_verification', 'archived', 'cooldown', 'banned') DEFAULT 'pending_verification'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('users', 'status')) $columnsToDrop[] = 'status';
            if (Schema::hasColumn('users', 'suspension_reason')) $columnsToDrop[] = 'suspension_reason';
            if (Schema::hasColumn('users', 'suspended_at')) $columnsToDrop[] = 'suspended_at';
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        Schema::table('pets', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('pets', 'suspension_reason')) $columnsToDrop[] = 'suspension_reason';
            if (Schema::hasColumn('pets', 'suspended_at')) $columnsToDrop[] = 'suspended_at';
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // Revert pets status enum (warning: data loss for 'cooldown' or 'banned' statuses)
        try {
            DB::statement("ALTER TABLE pets MODIFY COLUMN status ENUM('active', 'disabled', 'pending_verification', 'archived') DEFAULT 'pending_verification'");
        } catch (\Exception $e) {
            // Ignore if fails
        }
    }
};
