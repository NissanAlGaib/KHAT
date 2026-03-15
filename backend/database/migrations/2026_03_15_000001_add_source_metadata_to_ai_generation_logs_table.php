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
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->string('source_mode')->default('primary')->nullable()->after('prompt_used');
            $table->unsignedTinyInteger('source_photo_count')->nullable()->after('source_mode');
            $table->json('source_photo_ids')->nullable()->after('source_photo_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_generation_logs', function (Blueprint $table) {
            $table->dropColumn(['source_mode', 'source_photo_count', 'source_photo_ids']);
        });
    }
};
