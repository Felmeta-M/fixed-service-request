<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Adds columns for manual survey response data:
     * - media_type: PON (fiber) or COPPER - from BSS param 50005
     * - line_indicator: 0=same line, 1=separate line - from BSS param 50112
     * - survey_failure_reason: Reason for survey failure (e.g., "Need rehabilitation")
     *
     * Note: cable_type column already exists (BSS param 50056)
     *
     * Survey result logic:
     * - If 50005 = -1: Survey FAILED, extract CauseContent as failure reason
     * - If 50005 = PON/COPPER: Survey COMPLETED, proceed to device selection
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            // Media type: PON (fiber) or COPPER - critical for device selection
            // Value of -1 means survey failed
            $table->string('media_type', 20)->nullable()->after('cable_type');

            // Line indicator: 0=same line installation, 1=separate line installation (param 50112)
            $table->smallInteger('line_indicator')->nullable()->default(0)->after('media_type');

            // Survey failure reason from BSS CauseContent param (when 50005 = -1)
            $table->string('survey_failure_reason', 500)->nullable()->after('line_indicator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn([
                'media_type',
                'line_indicator',
                'survey_failure_reason',
            ]);
        });
    }
};
