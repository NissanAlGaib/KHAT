<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Upgrades user_reviews to a category-based rating system:
     *  - Adds review_type (breeder / shooter) and a cached average_rating column.
     *  - Adds contract_id FK for shooter reviews.
     *  - Creates a review_ratings detail table with one row per category.
     *  - Drops the legacy single-integer rating column.
     */
    public function up(): void
    {
        // 1. Alter user_reviews: add new columns
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->enum('review_type', ['breeder', 'shooter'])->default('breeder')->after('match_id');
            $table->decimal('average_rating', 3, 1)->nullable()->after('review_type');
            $table->foreignId('contract_id')->nullable()->after('match_id')
                ->constrained('breeding_contracts')->onDelete('set null');
        });

        // 2. Migrate existing single ratings into the new average_rating column
        \DB::statement('UPDATE user_reviews SET average_rating = rating WHERE rating IS NOT NULL');

        // 3. Drop legacy rating column
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropColumn('rating');
        });

        // 4. Create review_ratings detail table
        Schema::create('review_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_review_id')->constrained('user_reviews')->onDelete('cascade');
            $table->string('category', 50);
            $table->decimal('rating', 2, 1); // 0.5 – 5.0
            $table->timestamps();

            $table->unique(['user_review_id', 'category']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_ratings');

        Schema::table('user_reviews', function (Blueprint $table) {
            $table->tinyInteger('rating')->nullable()->after('match_id');
        });

        \DB::statement('UPDATE user_reviews SET rating = ROUND(average_rating) WHERE average_rating IS NOT NULL');

        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn(['review_type', 'average_rating', 'contract_id']);
        });
    }
};
