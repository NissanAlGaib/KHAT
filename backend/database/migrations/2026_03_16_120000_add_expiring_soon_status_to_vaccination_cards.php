<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('vaccination_cards') || !Schema::hasColumn('vaccination_cards', 'status')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE vaccination_cards MODIFY COLUMN status ENUM('not_started', 'in_progress', 'completed', 'overdue', 'expiring_soon') DEFAULT 'not_started'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('vaccination_cards') || !Schema::hasColumn('vaccination_cards', 'status')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Normalize values before reverting enum definition.
        DB::table('vaccination_cards')
            ->where('status', 'expiring_soon')
            ->update(['status' => 'overdue']);

        DB::statement("ALTER TABLE vaccination_cards MODIFY COLUMN status ENUM('not_started', 'in_progress', 'completed', 'overdue') DEFAULT 'not_started'");
    }
};
