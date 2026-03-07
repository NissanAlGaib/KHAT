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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'suspension_end_date')) {
                $table->timestamp('suspension_end_date')->nullable()->after('suspended_at');
            }
        });

        Schema::table('pets', function (Blueprint $table) {
            if (!Schema::hasColumn('pets', 'suspension_end_date')) {
                $table->timestamp('suspension_end_date')->nullable()->after('suspended_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'suspension_end_date')) {
                $table->dropColumn('suspension_end_date');
            }
        });

        Schema::table('pets', function (Blueprint $table) {
            if (Schema::hasColumn('pets', 'suspension_end_date')) {
                $table->dropColumn('suspension_end_date');
            }
        });
    }
};
