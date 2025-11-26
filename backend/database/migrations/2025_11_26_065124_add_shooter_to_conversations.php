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
        Schema::table('conversations', function (Blueprint $table) {
            // Add shooter_user_id to track when shooter is added to conversation
            $table->foreignId('shooter_user_id')->nullable()->constrained('users')->onDelete('set null');
        });

        // Add shooter collateral field to breeding contracts
        Schema::table('breeding_contracts', function (Blueprint $table) {
            $table->decimal('shooter_collateral', 10, 2)->nullable()->after('shooter_conditions');
            $table->boolean('shooter_collateral_paid')->default(false)->after('shooter_collateral');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('breeding_contracts', function (Blueprint $table) {
            $table->dropColumn(['shooter_collateral', 'shooter_collateral_paid']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['shooter_user_id']);
            $table->dropColumn('shooter_user_id');
        });
    }
};
