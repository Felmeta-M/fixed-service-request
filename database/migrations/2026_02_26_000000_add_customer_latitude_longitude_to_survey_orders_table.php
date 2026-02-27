<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->decimal('customer_latitude', 10, 8)->nullable()->after('long');
            $table->decimal('customer_longitude', 11, 8)->nullable()->after('customer_latitude');
        });
    }

    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn(['customer_latitude', 'customer_longitude']);
        });
    }
};
