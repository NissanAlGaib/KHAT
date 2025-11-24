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
        Schema::table('user_auth', function (Blueprint $table) {
            $table->string('document_number')->nullable()->after('document_path')->comment('ID/Certificate number from the document');
            $table->string('document_name')->nullable()->after('document_number')->comment('Name as it appears on the document');
            $table->date('issue_date')->nullable()->after('document_name')->comment('Date the document was issued');
            $table->string('issuing_authority')->nullable()->after('issue_date')->comment('Authority that issued the document');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_auth', function (Blueprint $table) {
            $table->dropColumn(['document_number', 'document_name', 'issue_date', 'issuing_authority']);
        });
    }
};
