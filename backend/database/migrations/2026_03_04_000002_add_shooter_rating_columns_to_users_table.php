<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add shooter-specific cached rating columns to the users table.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('shooter_average_rating', 3, 1)->default(0.0)->after('review_count');
            $table->integer('shooter_review_count')->default(0)->after('shooter_average_rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['shooter_average_rating', 'shooter_review_count']);
        });
    }
};
