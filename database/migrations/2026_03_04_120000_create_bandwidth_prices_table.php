<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bandwidth_prices', function (Blueprint $table) {
            $table->id();
            $table->string('bandwidth_value')->unique();
            $table->decimal('price', 10, 2);
            $table->string('currency', 10)->default('ETB');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bandwidth_prices');
    }
};
