<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->decimal('cable_length', 20, 2)->nullable()->after('id');
            $table->string('cable_type')->nullable()->after('cable_length');
            $table->decimal('cable_charge')->nullable();
            $table->decimal('latitude', 10, 7)->nullable()->after('cable_type');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn([
                'cable_length',
                'cable_type',
                'cable_charge',
                'latitude',
                'longitude',
            ]);
        });
    }
};
