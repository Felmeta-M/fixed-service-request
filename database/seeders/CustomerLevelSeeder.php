<?php

namespace Database\Seeders;

use App\Models\CustomerLevel;
use Illuminate\Database\Seeder;

class CustomerLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customerLevels = [
            ['code' => '2', 'name' => 'VCC', 'sort_order' => 1],
            ['code' => '3', 'name' => 'VIC', 'sort_order' => 2],
            ['code' => '4', 'name' => 'Platinum', 'sort_order' => 3],
            ['code' => '5', 'name' => 'Gold', 'sort_order' => 4],
            ['code' => '6', 'name' => 'Silver', 'sort_order' => 5],
            ['code' => '7', 'name' => 'Bronze', 'sort_order' => 6],
            ['code' => '8', 'name' => 'Copper', 'sort_order' => 7],
        ];

        foreach ($customerLevels as $level) {
            CustomerLevel::updateOrCreate(
                ['code' => $level['code']],
                array_merge($level, ['status' => true])
            );
        }
    }
}
