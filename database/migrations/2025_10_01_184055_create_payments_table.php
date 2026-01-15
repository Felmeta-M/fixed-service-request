<?php

use App\Enums\FFDServiceProvisionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code')->index();
            $table->string('customer_survey_order_id')->unique();
            $table->string('merch_code')->nullable();
            $table->string('merch_order_id')->nullable();
            $table->string('payment_order_id')->nullable();
            $table->string('trans_id')->nullable()->unique();
            $table->decimal('total_amount', 12, 4);
            $table->decimal('cable_charge', 12, 2);
            $table->enum('status', array_column(FFDServiceProvisionStatus::cases(), 'value'))
                ->default(FFDServiceProvisionStatus::Pending->value);
            $table->json('service_details')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
