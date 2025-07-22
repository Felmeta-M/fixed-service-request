<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BandwidthOptionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('bandwidth_options')->insert([
            'residential_options' => json_encode([
                '5M', '10M', '12M', '20M', '50M', '100M', '200M', '7M', '9M'
            ]),
            'enterprise_options' => json_encode([
                '4M', '8M', '10M', '20M', '30M', '60M', '100M', '200M', '300M',
                '500M', '2Gbps', '1Gbps', '3Gbps', '5Gbps', '10832M', '1536M',
                '6067M', '7525M', '2560M'
            ]),
        ]);
    }
}
