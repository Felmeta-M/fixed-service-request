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
            ['id' => 25, 'name' => 'Journalist'],
            ['id' => 43, 'name' => 'Farming / Agriculture'],
            ['id' => 42, 'name' => 'Artists & Public Figures'],
            ['id' => 41, 'name' => 'Housewife / Homemaker'],
            ['id' => 39, 'name' => 'Retail & Service Workers'],
            ['id' => 38, 'name' => 'Health Care Workers'],
            ['id' => 37, 'name' => 'Blue-Collar Workers'],
            ['id' => 36, 'name' => 'Professionals'],
            ['id' => 35, 'name' => 'Executives'],
            ['id' => 34, 'name' => 'Student'],
        ]);
    }
}
