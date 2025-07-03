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
        Schema::create('resource_checks', function (Blueprint $table) {
            $table->id();
            $table->string('prod_spec_code');
            $table->integer('number_line');
            $table->string('event_code');
            $table->string('cust_id');
            $table->string('cust_name');
            $table->decimal('longitude', 10, 6);
            $table->decimal('latitude', 10, 6);
            $table->string('staff_code');
            $table->string('staff_name');
            $table->boolean('combo_flag');
            $table->string('cust_addr');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resource_checks');
    }
};
