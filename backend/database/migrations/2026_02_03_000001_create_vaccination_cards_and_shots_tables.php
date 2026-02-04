<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration creates a new card-based vaccination tracking system:
     * - VaccinationCard: One card per pet per vaccination type
     * - VaccinationShot: Individual shots under each card (add-only, never edited)
     */
    public function up(): void
    {
        // Create vaccination_cards table (one per pet per vaccine type)
        Schema::create('vaccination_cards', function (Blueprint $table) {
            $table->id('card_id');
            $table->foreignId('pet_id')->constrained('pets', 'pet_id')->onDelete('cascade');
            $table->string('vaccine_type'); // e.g., 'parvo', 'distemper', 'rabies', 'leptospirosis', or custom
            $table->string('vaccine_name'); // Display name: "Parvovirus", "Distemper", etc.
            $table->boolean('is_required')->default(true); // Required vs optional vaccine type
            $table->integer('total_shots_required')->nullable(); // null = recurring (like rabies yearly)
            $table->integer('interval_days')->nullable(); // Days between shots (for auto-calculation)
            $table->enum('recurrence_type', ['none', 'yearly', 'biannual'])->default('none'); // For recurring vaccines
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'overdue'])->default('not_started');
            $table->timestamps();
            
            // Ensure one card per pet per vaccine type
            $table->unique(['pet_id', 'vaccine_type']);
            $table->index('pet_id');
            $table->index('status');
        });

        // Create vaccination_shots table (individual shots - never edited, only added)
        Schema::create('vaccination_shots', function (Blueprint $table) {
            $table->id('shot_id');
            $table->foreignId('card_id')->constrained('vaccination_cards', 'card_id')->onDelete('cascade');
            $table->integer('shot_number'); // 1, 2, 3, etc.
            $table->string('vaccination_record'); // Proof document file path
            $table->string('clinic_name');
            $table->string('veterinarian_name');
            $table->date('date_administered');
            $table->date('expiration_date');
            $table->date('next_shot_date')->nullable(); // Auto-calculated for pending shots
            $table->enum('status', ['completed', 'pending', 'overdue', 'verified'])->default('completed');
            $table->enum('verification_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            
            // Each shot number should be unique per card
            $table->unique(['card_id', 'shot_number']);
            $table->index('card_id');
            $table->index('status');
            $table->index('date_administered');
        });

        // Seed the required vaccination types configuration
        DB::table('vaccination_cards')->insert([]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vaccination_shots');
        Schema::dropIfExists('vaccination_cards');
    }
};
