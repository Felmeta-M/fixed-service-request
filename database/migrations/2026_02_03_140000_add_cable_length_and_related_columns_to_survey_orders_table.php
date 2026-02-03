<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds cable_length, cable_type, cable_charge, lat, long and related columns
     * to survey_orders. Uses hasColumn so safe to run if some columns exist.
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('survey_orders', 'cable_length')) {
                $table->decimal('cable_length', 8, 2)->nullable()->after('id');
            }
            if (!Schema::hasColumn('survey_orders', 'cable_type')) {
                $table->string('cable_type')->nullable()->after('cable_length');
            }
            if (!Schema::hasColumn('survey_orders', 'cable_charge')) {
                $table->decimal('cable_charge', 10, 2)->nullable()->after('cable_type');
            }
            if (!Schema::hasColumn('survey_orders', 'other_related_cost')) {
                $table->decimal('other_related_cost', 10, 2)->nullable()->after('cable_charge');
            }
            if (!Schema::hasColumn('survey_orders', 'lat')) {
                $table->decimal('lat', 10, 7)->nullable()->after('cable_charge');
            }
            if (!Schema::hasColumn('survey_orders', 'long')) {
                $table->decimal('long', 10, 7)->nullable()->after('lat');
            }
            if (!Schema::hasColumn('survey_orders', 'media_type')) {
                $table->string('media_type', 20)->nullable()->after('long');
            }
            if (!Schema::hasColumn('survey_orders', 'line_indicator')) {
                $table->smallInteger('line_indicator')->nullable()->default(0)->after('media_type');
            }
            if (!Schema::hasColumn('survey_orders', 'survey_failure_reason')) {
                $table->string('survey_failure_reason', 500)->nullable()->after('line_indicator');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $columns = [
                'cable_length',
                'cable_type',
                'cable_charge',
                'other_related_cost',
                'lat',
                'long',
                'media_type',
                'line_indicator',
                'survey_failure_reason',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('survey_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
