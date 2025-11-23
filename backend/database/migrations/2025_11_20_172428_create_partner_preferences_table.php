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
        Schema::create('partner_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained('pets', 'pet_id')->onDelete('cascade');
            $table->string('preferred_breed')->nullable();
            $table->json('preferred_behaviors')->nullable(); // e.g., ["LOYAL", "PLAYFUL"]
            $table->json('preferred_attributes')->nullable(); // e.g., ["SMALL", "BROWN"]
            $table->integer('min_age')->nullable()->comment('Minimum age in months');
            $table->integer('max_age')->nullable()->comment('Maximum age in months');
            $table->enum('preferred_sex', ['male', 'female', 'any'])->default('any');
            $table->timestamps();

            $table->index('pet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_preferences');
    }
};
