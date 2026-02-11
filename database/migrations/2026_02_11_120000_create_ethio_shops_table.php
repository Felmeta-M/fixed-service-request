<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ethio_shops', function (Blueprint $table) {
            $table->id();
            $table->string('zone')->index();
            $table->unsignedBigInteger('area_id')->nullable()->index();
            $table->string('center_name')->index();
            $table->string('building_name');
            $table->string('specific_location')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ethio_shops');
    }
};
