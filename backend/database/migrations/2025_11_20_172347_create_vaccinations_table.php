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
        Schema::create('vaccinations', function (Blueprint $table) {
            $table->id('vaccination_id');
            $table->foreignId('pet_id')->constrained('pets', 'pet_id')->onDelete('cascade');
            $table->string('vaccine_name'); // e.g., Rabies, DHPP, Bordetella, Other
            $table->string('vaccination_record'); // file path for certificate
            $table->string('clinic_name');
            $table->string('veterinarian_name');
            $table->date('given_date');
            $table->date('expiration_date');
            $table->enum('status', ['verified', 'pending', 'expired'])->default('pending');
            $table->timestamps();

            $table->index('pet_id');
            $table->index('expiration_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vaccinations');
    }
};
