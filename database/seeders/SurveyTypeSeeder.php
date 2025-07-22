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
            ['id' => 1, 'name' => 'Survey for New connection'],
            ['id' => 2, 'name' => 'Survey for Change primary offer'],
            ['id' => 3, 'name' => 'Survey for Upgrade'],
            ['id' => 5, 'name' => 'Survey for Shifting(within or across site)'],
            ['id' => 6, 'name' => 'Survey for Reconnection'],
            ['id' => 7, 'name' => 'Survey for Change Offering Attribute'],
            ['id' => 8, 'name' => 'Survey for Change Copper to Fiber'],
        ]);
    }
}
