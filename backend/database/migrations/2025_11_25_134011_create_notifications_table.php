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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // user_verification, pet_verification
            $table->string('title');
            $table->text('message');
            $table->string('status')->nullable(); // approved, rejected
            $table->unsignedBigInteger('reference_id')->nullable(); // auth_id, pet_id, vaccination_id, health_record_id
            $table->string('reference_type')->nullable(); // user_auth, pet, vaccination, health_record
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
