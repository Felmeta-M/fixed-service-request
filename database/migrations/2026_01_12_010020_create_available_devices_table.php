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
        Schema::create('available_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->comment('Device name (e.g. ONT Router, Modem)');
            $table->string('vendor')->comment('Device vendor/brand (e.g. Huawei, ZTE)');
            $table->string('model')->nullable()->comment('Device model number');
            $table->decimal('price', 10, 2)->comment('Device price');
            $table->text('description')->nullable()->comment('Device description and features');
            $table->enum('status', ['active', 'inactive'])->default('active')->comment('Device availability status');
            $table->string('image_url')->nullable()->comment('Device image URL');
            $table->integer('stock_quantity')->default(0)->comment('Available stock quantity');
            $table->json('specifications')->nullable()->comment('Device technical specifications');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('status');
            $table->index('vendor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('available_devices');
    }
};
