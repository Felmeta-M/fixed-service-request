<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();

            $table->foreignId('survey_request_id')
                ->constrained('survey_orders')
                ->cascadeOnDelete();

            $table->string('name')->comment('Device name (e.g. Router, Modem)');
            $table->string('brand')->comment('Device brand (e.g. Huawei, ZTE)');
            $table->string('model')->comment('Device model');
            $table->string('serial')->unique()->comment('Unique device serial number');

            $table->decimal('price', 10, 2)
                ->nullable()
                ->comment('Device price at time of survey');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
