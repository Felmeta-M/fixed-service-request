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
        Schema::create('number_pools', function (Blueprint $table) {
            $table->id();
            $table->string('zone')->comment('Zone code (e.g., EAAZ, NAAZ)');
            $table->unsignedInteger('dept_id')->comment('BSS Department ID');
            $table->timestamps();

            $table->unique(['zone', 'dept_id']);
            $table->index('zone');
            $table->index('dept_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('number_pools');
    }
};
