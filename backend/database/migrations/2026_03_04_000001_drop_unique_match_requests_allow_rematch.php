<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the unique constraint on (requester_pet_id, target_pet_id) so that
     * cancelled / declined / completed requests don't prevent re-matching.
     * A non-unique composite index is added for query performance.
     */
    public function up(): void
    {
        Schema::table('match_requests', function (Blueprint $table) {
            $table->dropUnique(['requester_pet_id', 'target_pet_id']);

            // Keep a non-unique composite index for fast look-ups
            $table->index(['requester_pet_id', 'target_pet_id'], 'match_requests_pair_index');
        });
    }

    /**
     * Reverse the migration – restore the unique constraint.
     */
    public function down(): void
    {
        Schema::table('match_requests', function (Blueprint $table) {
            $table->dropIndex('match_requests_pair_index');
            $table->unique(['requester_pet_id', 'target_pet_id']);
        });
    }
};
