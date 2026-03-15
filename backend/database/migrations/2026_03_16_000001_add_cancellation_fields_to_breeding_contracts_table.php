<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('breeding_contracts', function (Blueprint $table) {
            if (!Schema::hasColumn('breeding_contracts', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('rejected_at');
            }

            if (!Schema::hasColumn('breeding_contracts', 'cancelled_by')) {
                $table->foreignId('cancelled_by')
                    ->nullable()
                    ->after('cancellation_reason')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('breeding_contracts', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('cancelled_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('breeding_contracts', function (Blueprint $table) {
            if (Schema::hasColumn('breeding_contracts', 'cancelled_by')) {
                $table->dropConstrainedForeignId('cancelled_by');
            }

            if (Schema::hasColumn('breeding_contracts', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }

            if (Schema::hasColumn('breeding_contracts', 'cancellation_reason')) {
                $table->dropColumn('cancellation_reason');
            }
        });
    }
};
