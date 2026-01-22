<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateSubCitiesZoneCodeSeeder extends Seeder
{
    public function run()
    {
        $mapping = [
            'Bole'          => 7,   // EAAZ
            'Lemi Kura'     => 7,   // EAAZ
            'Adama City'    => 7,   // EAAZ
            'Yeka'          => 21,  // NAAZ
            'Kirkos'        => 21,  // NAAZ
            'Arada'         => 21,  // NAAZ
            'Nefas Silk'    => 30,  // SAAZ
            'Akaki Kality'  => 30,  // SAAZ
            'Kolfe'         => 40,  // SWAAZ
            'Lideta'        => 40,  // SWAAZ
            'Addis Ketema'  => 43,  // WAAZ
            'Gulele'        => 43,  // WAAZ
        ];

        foreach ($mapping as $pattern => $zoneCode) {
            DB::table('zones')
                ->where('name', 'ILIKE', "%{$pattern}%") // case-insensitive partial match
                ->update(['zone_code' => $zoneCode]);
        }

        $this->command->info("All sub-cities updated with their Ethio zone codes successfully.");
    }
}
