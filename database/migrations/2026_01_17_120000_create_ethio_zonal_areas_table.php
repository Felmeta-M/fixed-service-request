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
        Schema::create('ethio_zonal_areas', function (Blueprint $table) {
            $table->id();
            $table->string('area_code')->unique();
            $table->string('area_name');
            $table->string('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('area_code');
            $table->index('area_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ethio_zonal_areas');
    }
};
