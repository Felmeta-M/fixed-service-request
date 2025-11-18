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
            $table->string('sub')->nullable();
            $table->string('code')->nullable();
            $table->string('name')->nullable();
            $table->string('phone')->nullable();
            $table->string('title')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('identification_type')->nullable();
            $table->string('identification_number')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->string('occupation')->nullable();
            $table->string('education')->nullable();
            $table->string('religion')->nullable();
            $table->string('income')->nullable();
            $table->string('primary_language')->nullable();
            $table->string('picture')->nullable();

            // Address Info
            $table->json('address')->nullable();

            // Contact Info
            $table->json('contact')->nullable();

            // Contact Person List
            $table->json('contact_persons')->nullable();

            $table->timestamps();

            $table->SoftDeletes();
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
