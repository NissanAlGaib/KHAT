<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Capitalize the first letter of all pet species values.
     */
    public function up(): void
    {
        DB::statement("UPDATE pets SET species = CONCAT(UPPER(SUBSTRING(species, 1, 1)), LOWER(SUBSTRING(species, 2)))");
    }

    /**
     * No meaningful rollback — data was inconsistent before.
     */
    public function down(): void
    {
        // Not reversible
    }
};
