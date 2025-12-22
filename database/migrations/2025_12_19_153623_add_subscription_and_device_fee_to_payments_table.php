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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('service_number')->nullable();
            $table->decimal('subscription_fee', 10, 2)->default(0)->after('total_amount')->comment('Subscription fee for the payment');
            $table->decimal('device_fee', 10, 2)->default(0)->after('subscription_fee')->comment('Device fee for the payment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['service_number', 'subscription_fee', 'device_fee']);
        });
    }
};
