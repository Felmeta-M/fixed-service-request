<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds device_voice_offer_id for combo service device (voice) offer id.
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->string('device_voice_offer_id')->nullable()->after('device_offer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn('device_voice_offer_id');
        });
    }
};
