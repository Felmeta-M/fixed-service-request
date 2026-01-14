<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TelecomRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            ['area_id' => '5962', 'area_name' => 'Legetafo Business Area', 'zone' => 'EAAZ'],
            ['area_id' => '6044', 'area_name' => 'Bole Arabsa', 'zone' => 'EAAZ'],
            ['area_id' => '2086', 'area_name' => 'Eastern AA Zone', 'zone' => 'EAAZ'],
            ['area_id' => '2089', 'area_name' => 'Bole Michael Area', 'zone' => 'EAAZ'],
            ['area_id' => '2111', 'area_name' => 'Legedade Paystation', 'zone' => 'EAAZ'],
            ['area_id' => '2092', 'area_name' => 'London Cafa Business Area', 'zone' => 'EAAZ'],
            ['area_id' => '189', 'area_name' => 'Bole Medhanealem', 'zone' => 'EAAZ'],
            ['area_id' => '5268', 'area_name' => 'NEW BOLE LONDON NOVIS SHOP', 'zone' => 'EAAZ'],
            ['area_id' => '5313', 'area_name' => 'GURD SHOLA SHOP', 'zone' => 'EAAZ'],
            ['area_id' => '187', 'area_name' => 'EAAZ-Bus.Admin', 'zone' => 'EAAZ'],
            ['area_id' => '2090', 'area_name' => 'Gereji Area', 'zone' => 'EAAZ'],
            ['area_id' => '5938', 'area_name' => 'Bole Gurd-Sholla', 'zone' => 'EAAZ'],
            ['area_id' => '5940', 'area_name' => 'Ayat Area', 'zone' => 'EAAZ'],
            ['area_id' => '5941', 'area_name' => 'Summit Area', 'zone' => 'EAAZ'],
            ['area_id' => '6045', 'area_name' => 'Yeka Abado Area', 'zone' => 'EAAZ'],
            ['area_id' => '5965', 'area_name' => 'Bole Millennium Business Area', 'zone' => 'EAAZ'],
            ['area_id' => '5974', 'area_name' => 'Goro-Figa', 'zone' => 'EAAZ'],
            ['area_id' => '5963', 'area_name' => 'Atlas', 'zone' => 'EAAZ'],
            ['area_id' => '60060', 'area_name' => 'Summit 72', 'zone' => 'EAAZ'],
        ];

        $now = now();

        foreach ($regions as &$region) {
            $region['status'] = true;
            $region['created_at'] = $now;
            $region['updated_at'] = $now;
        }

        DB::table('telecom_regions')->upsert(
            $regions,
            ['area_id'],
            ['area_name', 'zone', 'status', 'updated_at']
        );
    }
}
