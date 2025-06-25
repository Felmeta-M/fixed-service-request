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
        Schema::create('survey_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('customer_code');
            $table->string('survey_request_number')->unique();
            $table->string('survey_type'); //new or change
            $table->string('telecom_region');
            $table->string('operation_type');
            $table->string('main_offer_id');
            $table->string('bandwidth');
            $table->string('contact_person');
            $table->string('contact_no');
            $table->string('contact_email');
            $table->string('sec_contact_person');
            $table->string('sec_contact_no');
            $table->string('sec_contact_email');
            $table->string('status');
            $table->dateTime('completed_date');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_orders');
    }
};
