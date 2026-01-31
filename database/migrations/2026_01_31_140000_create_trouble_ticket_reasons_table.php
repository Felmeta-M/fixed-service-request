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
        Schema::create('trouble_ticket_reasons', function (Blueprint $table) {
            $table->id();
            $table->integer('network_type')->comment('Network type identifier');
            $table->string('network_name')->comment('Network name: GSM, FBB, Fixed Line');
            $table->string('reason_path')->comment('Reason path/category');
            $table->text('reason')->comment('Reason description');
            $table->boolean('status')->default(true)->comment('Active status: 1 = active, 0 = inactive');
            $table->timestamps();

            $table->index(['network_type', 'network_name']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trouble_ticket_reasons');
    }
};
