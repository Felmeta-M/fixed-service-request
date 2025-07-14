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
        Schema::create('primary_offerings', function (Blueprint $table) {
            $table->id();
            $table->string('offering_id')->unique();
            $table->string('offering_name');
            $table->string('offering_short_name')->nullable();
            $table->integer('network_type')->nullable();
            $table->string('effective_date')->nullable();
            $table->string('expire_date')->nullable();
            $table->decimal('monthly_cost', 10, 2)->nullable();
            $table->decimal('one_time_cost', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('primary_offerings');
    }
};
