<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Adds media_type column to available_devices table for filtering devices
     * based on survey result infrastructure type.
     *
     * Media types:
     * - PON: Fiber devices (GPON/EPON)
     * - COPPER: Copper devices
     * - UNIVERSAL: Works with both fiber and copper
     */
    public function up(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->enum('media_type', ['PON', 'COPPER', 'UNIVERSAL'])
                ->default('UNIVERSAL')
                ->after('device_type')
                ->comment('Infrastructure type: PON (fiber), COPPER, or UNIVERSAL (both)');

            $table->index('media_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->dropIndex(['media_type']);
            $table->dropColumn('media_type');
        });
    }
};
