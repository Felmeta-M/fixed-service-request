<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * These fields are used by BSS (Huawei) subscription services
     * to avoid hardcoding customer classification data.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // BSS Customer Classification
            $table->string('customer_type', 10)->default('2')->after('house_no')
                ->comment('BSS CustomerType: 1=Enterprise, 2=Residential');

            $table->string('customer_category', 10)->default('5')->after('customer_type')
                ->comment('BSS CustomerCategory');

            $table->string('customer_subcategory', 10)->default('14')->after('customer_category')
                ->comment('BSS CustomerSubcategory');

            $table->string('customer_level', 10)->default('2')->after('customer_subcategory')
                ->comment('BSS CustomerLevel');

            // Notification Preferences
            $table->string('notification_mode', 10)->default('2')->after('customer_level')
                ->comment('Notification channel: 1=Email, 2=SMS, 3=Both');

            $table->string('credit_class', 20)->default('Excellent')->after('notification_mode')
                ->comment('Customer credit rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'customer_type',
                'customer_category',
                'customer_subcategory',
                'customer_level',
                'notification_mode',
                'credit_class',
            ]);
        });
    }
};
