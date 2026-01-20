<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReligionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Codes are preserved for third-party API integration.
     */
    public function run(): void
    {
        $now = now();

        $religions = [
            ['code' => '1', 'label' => 'Christianity', 'status' => true, 'sort_order' => 1],
            ['code' => '2', 'label' => 'Islam', 'status' => true, 'sort_order' => 2],
            ['code' => '3', 'label' => 'Other', 'status' => true, 'sort_order' => 6],
            ['code' => '4', 'label' => 'Catholics', 'status' => true, 'sort_order' => 3],
            ['code' => '5', 'label' => 'Orthodox', 'status' => true, 'sort_order' => 4],
            ['code' => '6', 'label' => 'Protestant', 'status' => true, 'sort_order' => 5],
        ];

        foreach ($religions as &$religion) {
            $religion['created_at'] = $now;
            $religion['updated_at'] = $now;
        }

        DB::table('religions')->upsert(
            $religions,
            ['code'],
            ['label', 'status', 'sort_order', 'updated_at']
        );
    }
}
