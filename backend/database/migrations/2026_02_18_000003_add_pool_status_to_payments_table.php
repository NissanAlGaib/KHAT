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
        Schema::table('payments', function (Blueprint $table) {
            $table->enum('pool_status', [
                'not_pooled',
                'in_pool',
                'released',
                'refunded',
                'frozen',
                'partially_refunded',
            ])->default('not_pooled')->after('status');
            $table->string('paymongo_refund_id')->nullable()->after('paymongo_payment_intent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['pool_status', 'paymongo_refund_id']);
        });
    }
};
