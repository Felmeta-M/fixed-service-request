<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\CustomerTypeCategorySubcategorySeeder;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SurveyTypeSeeder::class);
        $this->call(BandwidthOptionsSeeder::class);
        $this->call(OccupationSeeder::class);
        $this->call(CustomerTypeCategorySubcategorySeeder::class);
        $this->call(RegionZoneWeredaSeeder::class);
    }
}
