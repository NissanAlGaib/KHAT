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
        Schema::create('user_auth', function (Blueprint $table) {
            $table->id('auth_id');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('auth_type')->comment('Type of document submitted: id, breeder_certificate, shooter_certificate');
            $table->string('document_path')->nullable()->comment('Path to uploaded verification document');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('date_created')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_auth');
    }
};
