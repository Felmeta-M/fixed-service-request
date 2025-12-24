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
        Schema::table('trouble_tickets', function (Blueprint $table) {
            $table->string('last_synced_status')->nullable();
            $table->timestamp('last_checked_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trouble_tickets', function (Blueprint $table) {
            $table->dropColumn(['last_synced_status', 'last_checked_at']);
        });
    }
};
