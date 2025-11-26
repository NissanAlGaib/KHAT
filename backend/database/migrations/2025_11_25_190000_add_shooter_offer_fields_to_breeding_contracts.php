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
        Schema::table('breeding_contracts', function (Blueprint $table) {
            // Shooter offer status
            $table->foreignId('shooter_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('shooter_status', ['none', 'pending', 'accepted_by_shooter', 'accepted_by_owners', 'declined'])->default('none');
            $table->timestamp('shooter_accepted_at')->nullable();
            $table->boolean('owner1_accepted_shooter')->default(false);
            $table->boolean('owner2_accepted_shooter')->default(false);
        });

        // Update existing accepted contracts with shooter payment to have pending status
        DB::table('breeding_contracts')
            ->where('status', 'accepted')
            ->whereNotNull('shooter_payment')
            ->where('shooter_payment', '>', 0)
            ->update(['shooter_status' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('breeding_contracts', function (Blueprint $table) {
            $table->dropForeign(['shooter_user_id']);
            $table->dropColumn([
                'shooter_user_id',
                'shooter_status',
                'shooter_accepted_at',
                'owner1_accepted_shooter',
                'owner2_accepted_shooter',
            ]);
        });
    }
};
