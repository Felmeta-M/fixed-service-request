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
            $table->string('internet_account')->nullable()->after('fbb_service_number')
                ->comment('Internet account username/email for device configuration');
            $table->string('internet_password')->nullable()->after('internet_account')
                ->comment('Internet password for device configuration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn(['internet_account', 'internet_password']);
        });
    }
};
