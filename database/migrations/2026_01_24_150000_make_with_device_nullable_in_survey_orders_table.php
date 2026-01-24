<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Makes with_device nullable to support manual surveys where device selection
     * happens AFTER survey completion (when we know the media_type from BSS).
     *
     * - Auto surveys: with_device is set during initial request (true/false)
     * - Manual surveys: with_device starts as null, set after customer selects device
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->boolean('with_device')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->boolean('with_device')->default(false)->change();
        });
    }
};
