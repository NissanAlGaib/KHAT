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
            $table->string('firstName')->nullable()->after('name');
            $table->string('lastName')->nullable()->after('firstName');
            $table->string('contact_number')->nullable()->after('lastName');
            $table->date('birthdate')->nullable()->after('contact_number');
            $table->string('sex')->nullable()->after('birthdate');
            $table->json('address')->nullable()->after('sex');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('firstName');
            $table->dropColumn('lastName');
            $table->dropColumn('contact_number');
            $table->dropColumn('birthdate');
            $table->dropColumn('sex');
            $table->dropColumn('address');
        });
    }
};
