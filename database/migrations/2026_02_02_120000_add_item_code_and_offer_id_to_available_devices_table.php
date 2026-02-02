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
        Schema::table('available_devices', function (Blueprint $table) {
            $table->string('item_code')->nullable()->after('media_type');
            $table->string('offer_id')->nullable()->after('item_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->dropColumn(['item_code', 'offer_id']);
        });
    }
};
