<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('region')->nullable()->after('address');
            $table->string('city')->nullable()->after('region');
            $table->string('wereda')->nullable()->after('city');
            $table->string('zone')->nullable()->after('wereda');
            $table->string('kebele')->nullable()->after('zone');
            $table->string('house_no')->nullable()->after('kebele');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['region', 'city', 'wereda', 'zone', 'kebele', 'house_no']);
        });
    }
};
