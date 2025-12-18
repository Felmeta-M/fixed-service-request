<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trouble_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code');
            $table->string('access_number');
            $table->string('contact_person');
            $table->string('mobile_no');
            $table->string('trouble_title');
            $table->string('trouble_reason');
            $table->text('tt_description');
            $table->string('tt_serial_no')->unique();
            $table->enum('status', ['pending', 'in_progress', 'resolved', 'closed'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trouble_tickets');
    }
};
