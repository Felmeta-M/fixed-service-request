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
            $table->uuid('device_voice_id')->nullable()->after('device_id')->comment('Voice device ID for combo services');
            $table->foreign('device_voice_id')
                ->references('id')
                ->on('available_devices')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropForeign(['device_voice_id']);
            $table->dropColumn('device_voice_id');
        });
    }
};
