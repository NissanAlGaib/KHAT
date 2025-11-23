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
        Schema::create('health_records', function (Blueprint $table) {
            $table->id('health_record_id');
            $table->foreignId('pet_id')->constrained('pets', 'pet_id')->onDelete('cascade');
            $table->string('record_type')->default('Health Certificate'); // e.g., Health Certificate, Annual Checkup, Surgery, etc.
            $table->string('health_certificate'); // file path for certificate
            $table->string('clinic_name');
            $table->string('veterinarian_name');
            $table->date('given_date');
            $table->date('expiration_date');
            $table->text('notes')->nullable();
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
        Schema::dropIfExists('health_records');
    }
};
