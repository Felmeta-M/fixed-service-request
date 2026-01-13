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
        Schema::create('customer_subcategories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->nullable();
            $table->unsignedTinyInteger('api_value');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_subcategories');
    }
};
