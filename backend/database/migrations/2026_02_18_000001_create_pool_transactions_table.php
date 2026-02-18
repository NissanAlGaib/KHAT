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
        Schema::create('pool_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignId('contract_id')->nullable()->constrained('breeding_contracts')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', [
                'deposit',
                'hold',
                'release',
                'refund',
                'fee_deduction',
                'cancellation_penalty',
            ]);
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('PHP');
            $table->decimal('balance_after', 12, 2)->default(0);
            $table->enum('status', [
                'completed',
                'pending',
                'frozen',
                'cancelled',
            ])->default('completed');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes for common queries
            $table->index('payment_id');
            $table->index('contract_id');
            $table->index('user_id');
            $table->index('type');
            $table->index('status');
            $table->index(['contract_id', 'type']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pool_transactions');
    }
};
