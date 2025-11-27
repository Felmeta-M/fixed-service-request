<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('survey_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->cascadeOnDelete()->cascadeOnUpdate();
            $table->bigInteger('customer_code')->index();
            $table->bigInteger('customer_survey_order_id')->unique();
            $table->string('main_offer_id');
            $table->string('service_number')->nullable()->unique();
            $table->string('survey_type'); //new or change
            $table->string('telecom_region');
            $table->string('oper_type');
            $table->string('customer_type');
            $table->string('bandwidth');
            $table->string('contact_person');
            $table->string('contact_no');
            $table->string('contact_email');
            $table->string('sec_contact_person')->nullable();
            $table->string('sec_contact_no')->nullable();
            $table->string('sec_contact_email')->nullable();
            $table->string('status')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->bigInteger('completed_date')->nullable();
            $table->dateTime('subscribed_at')->nullable();
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
