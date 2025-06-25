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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('title')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('identification_type')->nullable();
            $table->string('identification_number')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->string('occupation')->nullable();
            $table->string('education')->nullable();
            $table->string('religion')->nullable();
            $table->string('income')->nullable();
            $table->string('primary_language')->nullable();

            // Address Info
            $table->json('address')->nullable();

            // Contact Info
            $table->json('contact')->nullable();

            // Contact Person List
            $table->json('contact_persons')->nullable();

            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
