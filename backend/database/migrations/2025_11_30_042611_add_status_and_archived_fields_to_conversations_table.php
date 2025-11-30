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
        Schema::table('conversations', function (Blueprint $table) {
            // Conversation status: active (ongoing), completed (match finalized), archived (hidden from list)
            $table->enum('status', ['active', 'completed', 'archived'])
                ->default('active')
                ->after('match_request_id');
            
            // When the match was marked as complete (offspring allocated, contract fulfilled)
            $table->timestamp('completed_at')
                ->nullable()
                ->after('status');
            
            // When the conversation was archived
            $table->timestamp('archived_at')
                ->nullable()
                ->after('completed_at');
            
            // Index for faster filtering
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn([
                'status',
                'completed_at',
                'archived_at',
            ]);
        });
    }
};
