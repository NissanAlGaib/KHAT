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
        Schema::create('ai_generation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('pet1_id');
            $table->unsignedBigInteger('pet2_id');
            $table->string('image_path');
            $table->text('prompt_used');
            $table->timestamps();

            // Foreign keys for pets (using pet_id as primary key)
            $table->foreign('pet1_id')->references('pet_id')->on('pets')->onDelete('cascade');
            $table->foreign('pet2_id')->references('pet_id')->on('pets')->onDelete('cascade');

            // Index for rate limit queries
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generation_logs');
    }
};
