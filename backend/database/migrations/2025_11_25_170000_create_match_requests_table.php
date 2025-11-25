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
        Schema::create('match_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requester_pet_id');
            $table->unsignedBigInteger('target_pet_id');
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();

            // Foreign keys
            $table->foreign('requester_pet_id')->references('pet_id')->on('pets')->onDelete('cascade');
            $table->foreign('target_pet_id')->references('pet_id')->on('pets')->onDelete('cascade');

            // Indexes
            $table->index('requester_pet_id');
            $table->index('target_pet_id');
            $table->index('status');

            // Prevent duplicate requests between same pets
            $table->unique(['requester_pet_id', 'target_pet_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_requests');
    }
};
