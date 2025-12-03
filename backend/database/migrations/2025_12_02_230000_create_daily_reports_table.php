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
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id('report_id');
            $table->unsignedBigInteger('contract_id');
            $table->unsignedBigInteger('reported_by'); // shooter_user_id or male pet owner id
            $table->date('report_date');
            $table->text('progress_notes');
            $table->enum('health_status', ['excellent', 'good', 'fair', 'poor', 'concerning'])->default('good');
            $table->text('health_notes')->nullable();
            $table->boolean('breeding_attempted')->default(false);
            $table->boolean('breeding_successful')->nullable(); // null if not attempted
            $table->text('additional_notes')->nullable();
            $table->string('photo_url')->nullable(); // optional photo for the daily report
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('breeding_contracts')->onDelete('cascade');
            $table->foreign('reported_by')->references('id')->on('users')->onDelete('cascade');
            
            // Ensure only one report per contract per day
            $table->unique(['contract_id', 'report_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_reports');
    }
};
