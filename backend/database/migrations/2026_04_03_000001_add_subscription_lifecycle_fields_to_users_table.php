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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('subscription_status', ['inactive', 'active', 'expired', 'canceled'])
                ->default('inactive')
                ->after('subscription_tier');
            $table->string('subscription_source')->nullable()->after('subscription_status');
            $table->enum('subscription_billing_cycle', ['monthly', 'yearly'])->nullable()->after('subscription_source');
            $table->timestamp('subscription_started_at')->nullable()->after('subscription_billing_cycle');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_started_at');
            $table->timestamp('subscription_canceled_at')->nullable()->after('subscription_expires_at');
            $table->unsignedBigInteger('subscription_latest_payment_id')->nullable()->after('subscription_canceled_at');

            $table->index('subscription_status');
            $table->index('subscription_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['subscription_status']);
            $table->dropIndex(['subscription_expires_at']);
            $table->dropColumn([
                'subscription_status',
                'subscription_source',
                'subscription_billing_cycle',
                'subscription_started_at',
                'subscription_expires_at',
                'subscription_canceled_at',
                'subscription_latest_payment_id',
            ]);
        });
    }
};
