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
        Schema::create('income_levels', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Unique code for third-party API integration');
            $table->string('label')->comment('Display label for the income level');
            $table->boolean('status')->default(true)->comment('Active status: 1 = active, 0 = inactive');
            $table->integer('sort_order')->default(0)->comment('Order for display purposes');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('income_levels');
    }
};
