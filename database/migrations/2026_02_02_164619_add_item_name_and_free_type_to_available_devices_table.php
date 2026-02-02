<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->string('item_name')->nullable();
            $table->string('item_type')->nullable();
            $table->decimal('discount_fee', 15, 4)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->dropColumn([
                'item_name',
                'item_type',
                'discount_fee',
            ]);
        });
    }
};
