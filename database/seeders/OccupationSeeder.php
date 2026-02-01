<?php

namespace Database\Seeders;

use App\Models\Occupation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OccupationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('occupations')->insert([
            ['id' => 25, 'code' => '25', 'name' => 'Journalist', 'status' => true],
            ['id' => 43, 'code' => '43', 'name' => 'Farming / Agriculture', 'status' => true],
            ['id' => 42, 'code' => '42', 'name' => 'Artists & Public Figures', 'status' => true],
            ['id' => 41, 'code' => '41', 'name' => 'Housewife / Homemaker', 'status' => true],
            ['id' => 39, 'code' => '39', 'name' => 'Retail & Service Workers', 'status' => true],
            ['id' => 38, 'code' => '38', 'name' => 'Health Care Workers', 'status' => true],
            ['id' => 37, 'code' => '37', 'name' => 'Blue-Collar Workers', 'status' => true],
            ['id' => 36, 'code' => '36', 'name' => 'Professionals', 'status' => true],
            ['id' => 35, 'code' => '35', 'name' => 'Executives', 'status' => true],
            ['id' => 34, 'code' => '34', 'name' => 'Student', 'status' => true],
        ]);
    }
}
