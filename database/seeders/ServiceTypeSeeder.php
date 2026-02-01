<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        DB::table('service_types')->upsert([
            [
                'code' => '1457567289',
                'name' => 'Fixed Broadband',
                'description' => 'High-speed internet connection',
                'icon' => 'Wifi',
                'color' => 'blue',
                'status' => true,
                'recommended' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => '1207609454',
                'name' => 'Fixed Voice',
                'description' => 'Reliable telephone service connectivity',
                'icon' => 'Phone',
                'color' => 'green',
                'status' => true,
                'recommended' => false,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => '102647257',
                'name' => 'Combo Services',
                'description' => 'Bundle of internet and voice services',
                'icon' => 'Package',
                'color' => 'purple',
                'status' => true,
                'recommended' => false,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['code'], ['name', 'description', 'icon', 'color', 'status', 'recommended', 'sort_order', 'updated_at']);
    }
}
