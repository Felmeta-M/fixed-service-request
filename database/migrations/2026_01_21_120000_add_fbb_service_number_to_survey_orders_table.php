<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * For Combo services:
     * - service_number: Voice service number (we provide)
     * - fbb_service_number: Data/FBB service number (BSS returns)
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->string('fbb_service_number')->nullable()->after('service_number')
                ->comment('FBB/Data service number returned by BSS for combo services');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn('fbb_service_number');
        });
    }
};
