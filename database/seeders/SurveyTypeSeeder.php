<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SurveyTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('survey_types')->insert([
            ['id' => 1, 'code' => 'EIC08', 'name' => 'Survey for New connection'],
            ['id' => 2, 'code' => 'EIC09', 'name' => 'Survey for Change primary offer'],
            ['id' => 3, 'code' => 'EIC10', 'name' => 'Survey for Upgrade'],
            ['id' => 5, 'code' => 'EIC11', 'name' => 'Survey for Shifting(within or across site)'],
            ['id' => 6, 'code' => 'EIC12', 'name' => 'Survey for Reconnection'],
            ['id' => 7, 'code' => 'EIC13', 'name' => 'Survey for Change Offering Attribute'],
            ['id' => 8, 'code' => 'EIC16', 'name' => 'Survey for Change Copper to Fiber'],
        ]);
    }
}
