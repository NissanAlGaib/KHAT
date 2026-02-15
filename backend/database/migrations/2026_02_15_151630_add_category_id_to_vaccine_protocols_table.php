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
        Schema::table('vaccine_protocols', function (Blueprint $table) {
            $table->foreignId('protocol_category_id')->nullable()->after('id')->constrained('protocol_categories')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccine_protocols', function (Blueprint $table) {
            $table->dropForeign(['protocol_category_id']);
            $table->dropColumn('protocol_category_id');
        });
    }
};
