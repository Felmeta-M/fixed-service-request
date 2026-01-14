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
            $table->enum('device_type', ['broadband', 'voice', 'universal'])->default('broadband')->after('model')->comment('Device type: broadband for internet, voice for telephone, universal for both');
            $table->index('device_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->dropIndex(['device_type']);
            $table->dropColumn('device_type');
        });
    }
};
