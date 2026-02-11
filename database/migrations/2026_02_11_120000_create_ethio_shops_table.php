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
            $table->string('center_name')->index();
            $table->string('building_name')->index();
            $table->string('shop_name')->unique();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ethio_shops');
    }
};
