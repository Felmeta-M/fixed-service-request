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
        Schema::create('telecom_regions', function (Blueprint $table) {
            $table->id();
            $table->string('area_id')->unique()->comment('BSS Area ID');
            $table->string('area_name')->comment('Area name for display');
            $table->string('zone')->nullable()->comment('Zone code (e.g., EAAZ)');
            $table->boolean('status')->default(true);
            $table->timestamps();

            $table->index('area_name');
            $table->index('zone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telecom_regions');
    }
};
