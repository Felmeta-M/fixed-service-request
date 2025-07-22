<?php

namespace Database\Seeders;

use App\Models\Occupation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OccupationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            'Management occupations',
            'Business and financial operations occupations',
            'Computer and mathematical occupations',
            'Architecture and engineering occupations',
            'Life, physical, and social science occupations',
            'Community and social services occupations',
            'Legal occupations',
            'Education, training, and library occupations',
            'Arts, design, entertainment, sports, and media occupations',
            'Healthcare practitioners and technical occupations',
            'Healthcare support occupations',
            'Protective service occupations',
            'Food preparation and serving related occupations',
            'Building and grounds cleaning and maintenance occupations',
            'Personal care and service occupations',
            'Sales and related occupations',
            'Office and administrative support occupations',
            'Farming, fishing, and forestry occupations',
            'Construction and extraction occupations',
            'Installation, maintenance, and repair occupations',
            'Production occupations',
            'Transportation and material moving occupations',
            'Military specific occupations',
            'Other',
            'Journalist',
            'Celebrity',
            'Media professional',
            'Social Media influencer',
            'Reporter',
            'Editor',
            'Backend & Front end user in the chain',
            'Certified journalist on different local and regional media\'s',
            'GasStaOperator',
            'Student',
        ];

        foreach ($data as $remark) {
            Occupation::create(['remark' => $remark]);
        }
    }
}
