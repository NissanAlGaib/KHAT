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
        Schema::table('pets', function (Blueprint $table) {
            // Cooldown period after successful breeding
            $table->timestamp('cooldown_until')->nullable()->after('breeding_count')
                ->comment('Pet cannot be matched until this date after successful breeding');
            
            // Index for efficient querying of pets on cooldown
            $table->index('cooldown_until');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropIndex(['cooldown_until']);
            $table->dropColumn('cooldown_until');
        });
    }
};
