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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            
            // User who made the payment
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Optional: link to breeding contract
            $table->foreignId('contract_id')->nullable()->constrained('breeding_contracts')->onDelete('set null');
            
            // Payment details
            $table->string('payment_type'); // 'collateral', 'shooter_payment', 'monetary_compensation'
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('PHP');
            $table->string('description')->nullable();
            
            // PayMongo references
            $table->string('paymongo_checkout_id')->nullable()->index();
            $table->string('paymongo_checkout_url')->nullable();
            $table->string('paymongo_payment_id')->nullable()->index();
            $table->string('paymongo_payment_intent_id')->nullable()->index();
            
            // Status tracking
            $table->enum('status', [
                'pending',
                'awaiting_payment',
                'processing',
                'paid',
                'failed',
                'expired',
                'refunded'
            ])->default('pending');
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
