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
        // Add contract_id to litters table to link with breeding contract
        Schema::table('litters', function (Blueprint $table) {
            $table->foreignId('contract_id')
                ->nullable()
                ->after('litter_id')
                ->constrained('breeding_contracts')
                ->onDelete('set null');
        });

        // Add allocation fields to litter_offspring table
        Schema::table('litter_offspring', function (Blueprint $table) {
            // Who the offspring is assigned to (null = unassigned)
            $table->foreignId('assigned_to')
                ->nullable()
                ->after('notes')
                ->constrained('users')
                ->onDelete('set null');
            
            // Allocation status
            $table->enum('allocation_status', ['unassigned', 'assigned', 'transferred'])
                ->default('unassigned')
                ->after('assigned_to');
            
            // Selection order (for first_pick selection method)
            $table->integer('selection_order')
                ->nullable()
                ->after('allocation_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('litter_offspring', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn([
                'assigned_to',
                'allocation_status',
                'selection_order',
            ]);
        });

        Schema::table('litters', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn('contract_id');
        });
    }
};
