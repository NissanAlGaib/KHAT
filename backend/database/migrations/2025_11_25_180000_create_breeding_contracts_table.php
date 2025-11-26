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
        Schema::create('breeding_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('last_edited_by')->nullable()->constrained('users');

            // Contract Status: draft, pending_review, accepted, rejected
            $table->enum('status', ['draft', 'pending_review', 'accepted', 'rejected'])->default('draft');

            // Step 1: Shooter Agreement (Optional)
            $table->string('shooter_name')->nullable();
            $table->decimal('shooter_payment', 10, 2)->nullable();
            $table->string('shooter_location')->nullable();
            $table->text('shooter_conditions')->nullable();

            // Step 2: Payment & Compensation
            $table->date('end_contract_date')->nullable();
            $table->boolean('include_monetary_amount')->default(false);
            $table->decimal('monetary_amount', 10, 2)->nullable();
            $table->boolean('share_offspring')->default(false);
            $table->enum('offspring_split_type', ['percentage', 'specific_number'])->nullable();
            $table->integer('offspring_split_value')->nullable();
            $table->enum('offspring_selection_method', ['first_pick', 'randomized'])->nullable();
            $table->boolean('include_goods_foods')->default(false);
            $table->decimal('goods_foods_value', 10, 2)->nullable();

            // Collateral
            $table->decimal('collateral_total', 10, 2)->default(0);
            $table->decimal('collateral_per_owner', 10, 2)->default(0);
            $table->decimal('cancellation_fee_percentage', 5, 2)->default(5.00);

            // Step 3: Terms & Policies
            $table->text('pet_care_responsibilities')->nullable();
            $table->text('harm_liability_terms')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->text('custom_terms')->nullable();

            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            // Index for faster lookups
            $table->index('conversation_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('breeding_contracts');
    }
};
