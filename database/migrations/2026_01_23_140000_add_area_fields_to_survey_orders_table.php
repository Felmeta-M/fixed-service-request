<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->string('area_code')->nullable()->after('telecom_region');
            $table->string('area_name')->nullable()->after('area_code');
        });
    }

    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn(['area_code', 'area_name']);
        });
    }
};
