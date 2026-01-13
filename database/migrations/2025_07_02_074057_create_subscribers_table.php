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
        Schema::create('subscribers', function (Blueprint $table) {
            $table->id();
            $table->uuid('transaction_id');
            // CustomerBusiOrder
            $table->dateTime('process_time');
            $table->string('customer_survey_order_id');
            $table->string('customer_code');

            // AccountInfo
            $table->string('payment_type');
            $table->string('bill_cycle');
            $table->string('ethio_zone_or_region');
            $table->string('collection_center');
            $table->string('account_language');
            $table->string('first_name');
            $table->string('middle_or_father_name');
            $table->string('last_name');
            $table->string('enterprise_customer_name');
            $table->string('credit_class');
            $table->string('administrative_region_city');
            $table->string('subcity_zone');
            $table->string('wereda_town');
            $table->string('kebele');
            $table->string('house_no');
            $table->string('sms_no');
            $table->string('payment_mode');
            $table->json('account_ext_params')->nullable();

            // SubBusiOrderList > SubscriberInfo
            $table->string('business_code')->default('CO015');
            $table->string('external_sequence')->nullable();
            $table->string('network_type')->nullable();
            $table->string('sub_type')->nullable();
            $table->string('sub_language')->nullable();
            $table->string('offering_id')->nullable();
            $table->string('effective_mode')->nullable();
            $table->string('sla_priority')->nullable();
            $table->string('call_center_access')->nullable();

            // External fields
            $table->string('external_operid')->nullable();
            $table->string('installment_completed_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscribers');
    }
};
