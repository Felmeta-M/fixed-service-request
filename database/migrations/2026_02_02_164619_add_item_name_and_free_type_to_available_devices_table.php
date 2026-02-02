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

            $table->unsignedBigInteger('currency_id')->nullable();

            $table->decimal('calculated_fee', 15, 4)->nullable();
            $table->decimal('original_fee', 15, 4)->nullable();
            $table->decimal('discount_fee', 15, 4)->nullable();

            $table->string('tax_code')->nullable();
            $table->string('tax_name')->nullable();
            $table->decimal('tax_fee', 15, 4)->nullable();
            $table->decimal('tax_rate', 5, 4)->nullable();

            $table->unsignedTinyInteger('pay_type')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('available_devices', function (Blueprint $table) {
            $table->dropColumn([
                'item_name',
                'item_type',
                'currency_id',
                'calculated_fee',
                'original_fee',
                'discount_fee',
                'tax_code',
                'tax_name',
                'tax_fee',
                'tax_rate',
                'pay_type',
            ]);
        });
    }
};
