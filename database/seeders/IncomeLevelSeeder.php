<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IncomeLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Codes are preserved for third-party API integration.
     */
    public function run(): void
    {
        $now = now();

        $incomeLevels = [
            ['code' => '1', 'label' => 'Birr 0-999', 'status' => true, 'sort_order' => 1],
            ['code' => '2', 'label' => 'Birr 1,000-1,999', 'status' => true, 'sort_order' => 2],
            ['code' => '3', 'label' => 'Birr 2,000-3,499', 'status' => true, 'sort_order' => 3],
            ['code' => '4', 'label' => 'Birr 3,500-4,999', 'status' => true, 'sort_order' => 4],
            ['code' => '5', 'label' => 'Birr 5,000-7,999', 'status' => true, 'sort_order' => 5],
            ['code' => '6', 'label' => 'Birr 8,000-15,000', 'status' => true, 'sort_order' => 6],
            ['code' => '7', 'label' => 'Above Birr 15,000', 'status' => true, 'sort_order' => 7],
        ];

        foreach ($incomeLevels as &$level) {
            $level['created_at'] = $now;
            $level['updated_at'] = $now;
        }

        DB::table('income_levels')->upsert(
            $incomeLevels,
            ['code'],
            ['label', 'status', 'sort_order', 'updated_at']
        );
    }
}
