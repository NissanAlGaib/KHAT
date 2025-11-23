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
        Schema::create('litters', function (Blueprint $table) {
            $table->id('litter_id');
            $table->unsignedBigInteger('sire_id'); // Male parent pet_id
            $table->unsignedBigInteger('dam_id'); // Female parent pet_id
            $table->unsignedBigInteger('sire_owner_id'); // Owner of male parent
            $table->unsignedBigInteger('dam_owner_id'); // Owner of female parent
            $table->date('birth_date');
            $table->integer('total_offspring')->default(0);
            $table->integer('alive_offspring')->default(0);
            $table->integer('died_offspring')->default(0);
            $table->integer('male_count')->default(0);
            $table->integer('female_count')->default(0);
            $table->string('status')->default('active'); // active, archived
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('sire_id')->references('pet_id')->on('pets')->onDelete('cascade');
            $table->foreign('dam_id')->references('pet_id')->on('pets')->onDelete('cascade');
            $table->foreign('sire_owner_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('dam_owner_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index('sire_id');
            $table->index('dam_id');
            $table->index('birth_date');
        });

        // Offspring tracking table
        Schema::create('litter_offspring', function (Blueprint $table) {
            $table->id('offspring_id');
            $table->unsignedBigInteger('litter_id');
            $table->unsignedBigInteger('pet_id')->nullable(); // Reference to pet if registered
            $table->string('name')->nullable();
            $table->string('sex');
            $table->string('color')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('status')->default('alive'); // alive, died, adopted
            $table->date('death_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('litter_id')->references('litter_id')->on('litters')->onDelete('cascade');
            $table->foreign('pet_id')->references('pet_id')->on('pets')->onDelete('set null');

            // Indexes
            $table->index('litter_id');
            $table->index('pet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('litter_offspring');
        Schema::dropIfExists('litters');
    }
};
