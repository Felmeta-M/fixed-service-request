<?php

namespace Database\Seeders;

use App\Models\Region;
use App\Models\Wereda;
use App\Models\Zone;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RegionZoneWeredaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $path = database_path('Address_Hierarchy _listed.csv');
        $data = array_map('str_getcsv', file($path));
        $header = array_map('trim', array_shift($data));

        foreach ($data as $row) {
            $record = array_combine($header, $row);
            $region = Region::firstOrCreate([
                'id' => trim($record['region_id'])
            ], [
                'name' => Str::of($record['region_name'])->trim()->title()
            ]);

            $zone = Zone::firstOrCreate([
                'id' => trim($record['zone_id'])
            ], [
                'name' => Str::of($record['zone_name'])->trim()->title(),
                'region_id' => $region->id
            ]);

            Wereda::firstOrCreate([
                'id' => trim($record['wereda_id'])
            ], [
                'name' => Str::of($record['wereda_name'])->trim()->title(),
                'region_id' => $region->id,
                'zone_id' => $zone->id
            ]);
        }
    }
}
