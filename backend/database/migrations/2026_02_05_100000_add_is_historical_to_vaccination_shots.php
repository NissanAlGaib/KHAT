<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds is_historical flag to vaccination_shots table to distinguish
     * between shots recorded in real-time vs historical shots added retroactively.
     */
    public function up(): void
    {
        Schema::table('vaccination_shots', function (Blueprint $table) {
            $table->boolean('is_historical')->default(false)->after('verification_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccination_shots', function (Blueprint $table) {
            $table->dropColumn('is_historical');
        });
    }
};
