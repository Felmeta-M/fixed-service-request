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
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->string('zone_code')->nullable()->after('area_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn('zone_code');
        });
    }
};
