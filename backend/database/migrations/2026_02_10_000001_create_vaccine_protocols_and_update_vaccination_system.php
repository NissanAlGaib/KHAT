<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the admin-controlled vaccine_protocols table and updates
     * the vaccination_cards/shots tables for the new approval workflow.
     * 
     * Protocol types supported:
     * - Fixed series only (e.g., Distemper 3-shot): series_doses=3, has_booster=false
     * - Series + booster (e.g., Parvo 3-dose + annual): series_doses=3, has_booster=true, booster_interval_days=365
     * - Purely recurring (e.g., Rabies yearly): series_doses=null, has_booster=true, booster_interval_days=365
     */
    public function up(): void
    {
        // 1. Create vaccine_protocols table (admin-managed)
        Schema::create('vaccine_protocols', function (Blueprint $table) {
            $table->id();
            $table->string('name');                           // e.g., "Parvovirus (5-in-1)"
            $table->string('slug')->unique();                 // e.g., "parvo"
            $table->enum('species', ['dog', 'cat', 'all'])->default('all');
            $table->boolean('is_required')->default(true);
            $table->text('description')->nullable();

            // Series configuration
            $table->unsignedInteger('series_doses')->nullable();       // null = no fixed series (purely recurring)
            $table->unsignedInteger('series_interval_days')->nullable(); // days between series doses

            // Booster configuration
            $table->boolean('has_booster')->default(false);
            $table->unsignedInteger('booster_interval_days')->nullable(); // days between boosters

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['species', 'is_active']);
            $table->index('is_required');
            $table->index('sort_order');
        });

        // 2. Add vaccine_protocol_id FK to vaccination_cards
        Schema::table('vaccination_cards', function (Blueprint $table) {
            $table->unsignedBigInteger('vaccine_protocol_id')->nullable()->after('pet_id');
            $table->foreign('vaccine_protocol_id')
                ->references('id')
                ->on('vaccine_protocols')
                ->onDelete('set null');
            $table->index('vaccine_protocol_id');
        });

        // 3. Add is_booster and 'historical' verification_status to vaccination_shots
        Schema::table('vaccination_shots', function (Blueprint $table) {
            $table->boolean('is_booster')->default(false)->after('is_historical');
        });

        // Update verification_status enum to include 'historical'
        // MySQL requires ALTER to change enum values
        DB::statement("ALTER TABLE vaccination_shots MODIFY COLUMN verification_status ENUM('pending', 'approved', 'rejected', 'historical') DEFAULT 'pending'");

        // 4. Seed initial protocols (matching current REQUIRED_VACCINES config)
        DB::table('vaccine_protocols')->insert([
            [
                'name' => 'Parvovirus (5-in-1)',
                'slug' => 'parvo',
                'species' => 'dog',
                'is_required' => true,
                'description' => 'Core vaccine protecting against Parvovirus. Initial series followed by annual boosters.',
                'series_doses' => 3,
                'series_interval_days' => 21,
                'has_booster' => true,
                'booster_interval_days' => 365,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Distemper',
                'slug' => 'distemper',
                'species' => 'dog',
                'is_required' => true,
                'description' => 'Core vaccine protecting against Canine Distemper Virus. Initial series followed by annual boosters.',
                'series_doses' => 3,
                'series_interval_days' => 21,
                'has_booster' => true,
                'booster_interval_days' => 365,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Anti-Rabies',
                'slug' => 'rabies',
                'species' => 'all',
                'is_required' => true,
                'description' => 'Required by law. Yearly vaccination against Rabies.',
                'series_doses' => null,
                'series_interval_days' => null,
                'has_booster' => true,
                'booster_interval_days' => 365,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Leptospirosis',
                'slug' => 'leptospirosis',
                'species' => 'dog',
                'is_required' => true,
                'description' => 'Protection against Leptospira bacteria. Bi-annual vaccination recommended.',
                'series_doses' => null,
                'series_interval_days' => null,
                'has_booster' => true,
                'booster_interval_days' => 180,
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'FVRCP',
                'slug' => 'fvrcp',
                'species' => 'cat',
                'is_required' => true,
                'description' => 'Core feline vaccine protecting against Feline Viral Rhinotracheitis, Calicivirus, and Panleukopenia.',
                'series_doses' => 3,
                'series_interval_days' => 21,
                'has_booster' => true,
                'booster_interval_days' => 365,
                'is_active' => true,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'FeLV (Feline Leukemia)',
                'slug' => 'felv',
                'species' => 'cat',
                'is_required' => false,
                'description' => 'Recommended for cats with outdoor access. Initial 2-dose series with annual boosters.',
                'series_doses' => 2,
                'series_interval_days' => 21,
                'has_booster' => true,
                'booster_interval_days' => 365,
                'is_active' => true,
                'sort_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 5. Link existing vaccination_cards to the new protocols
        $protocols = DB::table('vaccine_protocols')->get();
        $slugMap = [
            'parvo' => 'parvo',
            'distemper' => 'distemper',
            'rabies' => 'rabies',
            'leptospirosis' => 'leptospirosis',
        ];

        foreach ($slugMap as $vaccineType => $slug) {
            $protocol = $protocols->firstWhere('slug', $slug);
            if ($protocol) {
                DB::table('vaccination_cards')
                    ->where('vaccine_type', $vaccineType)
                    ->update(['vaccine_protocol_id' => $protocol->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove is_booster column from vaccination_shots
        Schema::table('vaccination_shots', function (Blueprint $table) {
            $table->dropColumn('is_booster');
        });

        // Revert verification_status enum
        DB::statement("ALTER TABLE vaccination_shots MODIFY COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");

        // Remove FK and column from vaccination_cards
        Schema::table('vaccination_cards', function (Blueprint $table) {
            $table->dropForeign(['vaccine_protocol_id']);
            $table->dropColumn('vaccine_protocol_id');
        });

        // Drop vaccine_protocols table
        Schema::dropIfExists('vaccine_protocols');
    }
};
