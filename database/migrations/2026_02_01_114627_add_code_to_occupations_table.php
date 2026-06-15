<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('occupations', function (Blueprint $table) {
            $table->string('code')->nullable()->after('id');
        });

        // Set code to match id for existing records.
        // Use CAST(... AS TEXT) (portable) rather than the Postgres-only `id::text`,
        // so the migration also runs on SQLite (used by the test suite).
        DB::table('occupations')->whereNull('code')->update([
            'code' => DB::raw('CAST(id AS TEXT)'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('occupations', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
