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
        Schema::table('breeding_contracts', function (Blueprint $table) {
            // Breeding completion status
            $table->enum('breeding_status', ['pending', 'in_progress', 'completed', 'failed'])
                ->default('pending')
                ->after('status');
            
            // Who marked the breeding as complete (shooter or male pet owner)
            $table->foreignId('breeding_completed_by')
                ->nullable()
                ->after('breeding_status')
                ->constrained('users')
                ->onDelete('set null');
            
            // When breeding was marked as complete
            $table->timestamp('breeding_completed_at')
                ->nullable()
                ->after('breeding_completed_by');
            
            // Whether offspring were produced
            $table->boolean('has_offspring')
                ->default(false)
                ->after('breeding_completed_at');
            
            // Notes about the breeding completion
            $table->text('breeding_notes')
                ->nullable()
                ->after('has_offspring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('breeding_contracts', function (Blueprint $table) {
            $table->dropForeign(['breeding_completed_by']);
            $table->dropColumn([
                'breeding_status',
                'breeding_completed_by',
                'breeding_completed_at',
                'has_offspring',
                'breeding_notes',
            ]);
        });
    }
};
