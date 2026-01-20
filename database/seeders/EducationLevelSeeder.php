<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EducationLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Codes are preserved for third-party API integration.
     */
    public function run(): void
    {
        $now = now();

        $educationLevels = [
            ['code' => '1', 'label' => 'Illiterate', 'status' => true, 'sort_order' => 1],
            ['code' => '2', 'label' => 'Primary school', 'status' => true, 'sort_order' => 2],
            ['code' => '3', 'label' => 'Secondary school', 'status' => true, 'sort_order' => 3],
            ['code' => '4', 'label' => 'Diploma/certificate', 'status' => true, 'sort_order' => 4],
            ['code' => '5', 'label' => "Bachelor's degree", 'status' => true, 'sort_order' => 5],
            ['code' => '6', 'label' => "Master's degree and above", 'status' => true, 'sort_order' => 6],
            ['code' => '70', 'label' => 'Unknown', 'status' => true, 'sort_order' => 7],
            ['code' => '80', 'label' => 'Bachelor', 'status' => true, 'sort_order' => 8],
            ['code' => '90', 'label' => 'Master', 'status' => true, 'sort_order' => 9],
            ['code' => '100', 'label' => 'Doctor', 'status' => true, 'sort_order' => 10],
            ['code' => '110', 'label' => 'Others', 'status' => true, 'sort_order' => 11],
        ];

        foreach ($educationLevels as &$level) {
            $level['created_at'] = $now;
            $level['updated_at'] = $now;
        }

        DB::table('education_levels')->upsert(
            $educationLevels,
            ['code'],
            ['label', 'status', 'sort_order', 'updated_at']
        );
    }
}
