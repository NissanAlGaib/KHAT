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
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('breeding_contracts')->cascadeOnDelete();
            $table->foreignId('raised_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->text('resolution_notes')->nullable();
            $table->enum('status', [
                'open',
                'under_review',
                'resolved',
                'dismissed',
            ])->default('open');
            $table->enum('resolution_type', [
                'refund_full',
                'refund_partial',
                'release_funds',
                'forfeit',
            ])->nullable();
            $table->decimal('resolved_amount', 10, 2)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('contract_id');
            $table->index('raised_by');
            $table->index('status');
            $table->index(['contract_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
