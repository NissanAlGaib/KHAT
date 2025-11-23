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
        Schema::create('pets', function (Blueprint $table) {
            $table->id('pet_id');

            // Foreign Keys
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('rec_id')->nullable()->constrained('users')->onDelete('set null')->comment('Recommender ID');

            // Basic Information
            $table->string('name');
            $table->string('species'); // dog, cat, etc.
            $table->string('breed');
            $table->enum('sex', ['male', 'female']);
            $table->date('birthdate');
            $table->string('microchip_id')->unique()->nullable();

            // Physical Attributes
            $table->decimal('height', 8, 2)->comment('Height in cm');
            $table->decimal('weight', 8, 2)->comment('Weight in kg');

            // Status & Description
            $table->enum('status', ['active', 'disabled', 'pending_verification', 'archived'])->default('pending_verification');
            $table->text('description')->nullable();

            // Breeding History
            $table->boolean('has_been_bred')->default(false);
            $table->integer('breeding_count')->default(0);

            // Attributes & Behaviors (stored as JSON arrays)
            $table->json('behaviors')->nullable()->comment('e.g., ["LOYAL", "SOCIAL", "PLAYFUL"]');
            $table->json('attributes')->nullable()->comment('e.g., ["BROWN", "SMALL", "FLUFFY"]');

            // Profile Image
            $table->string('profile_image')->nullable();

            // Timestamps
            $table->timestamp('date_added')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('species');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
