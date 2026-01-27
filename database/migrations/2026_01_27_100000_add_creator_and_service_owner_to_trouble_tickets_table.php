<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add service owner info to trouble_tickets table for professional display
 * 
 * - customer_code: Already exists - stores logged-in user who created the TT
 * - service_owner_*: Customer info from the queried service number (actual owner)
 * - Address fields: For detailed TT display
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('trouble_tickets', function (Blueprint $table) {
            // Service owner info (from queried service number)
            $table->string('service_owner_code')->nullable()->after('customer_code');
            $table->string('service_owner_name')->nullable()->after('service_owner_code');
            $table->string('service_owner_type')->nullable()->after('service_owner_name');
            $table->string('service_owner_level')->nullable()->after('service_owner_type');

            // Service location/address for TT detail display
            $table->string('region')->nullable()->after('service_owner_level');
            $table->string('zone')->nullable()->after('region');
            $table->string('city')->nullable()->after('zone');
            $table->string('sub_city')->nullable()->after('city');
            $table->string('wereda')->nullable()->after('sub_city');
            $table->string('kebele')->nullable()->after('wereda');
            $table->string('house_no')->nullable()->after('kebele');

            // Index for faster lookups
            $table->index('service_owner_code');
        });
    }

    public function down(): void
    {
        Schema::table('trouble_tickets', function (Blueprint $table) {
            $table->dropIndex(['service_owner_code']);
            $table->dropColumn([
                'service_owner_code',
                'service_owner_name',
                'service_owner_type',
                'service_owner_level',
                'region',
                'zone',
                'city',
                'sub_city',
                'wereda',
                'kebele',
                'house_no',
            ]);
        });
    }
};
