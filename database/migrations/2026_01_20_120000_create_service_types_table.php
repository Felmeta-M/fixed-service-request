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
        Schema::create('service_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Unique identifier code for the service type');
            $table->string('name')->comment('Display name for the service type');
            $table->string('description')->nullable()->comment('Description of the service type');
            $table->string('icon')->nullable()->comment('Icon identifier for frontend display');
            $table->string('color')->nullable()->comment('Color identifier for frontend display');
            $table->boolean('status')->default(true)->comment('Active status: 1 = active, 0 = inactive');
            $table->boolean('recommended')->default(false)->comment('Whether this service is recommended');
            $table->integer('sort_order')->default(0)->comment('Order for display purposes');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_types');
    }
};
