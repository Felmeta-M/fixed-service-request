<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove legacy columns; use voice_service_number and data_service_number only.
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn(['service_number', 'fbb_service_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->string('service_number')->nullable()->after('main_offer_id');
            $table->string('fbb_service_number')->nullable()->after('service_number');
        });
    }
};
