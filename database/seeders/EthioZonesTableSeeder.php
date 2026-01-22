<?php

namespace Database\Seeders;


use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EthioZonesTableSeeder extends Seeder
{
    public function run()
    {
        $zones = [
            ['code' => 1, 'name' => 'ASOSA'],
            ['code' => 1109645519, 'name' => 'NEER'],
            ['code' => 1207195783, 'name' => 'CER'],
            ['code' => 1407195726, 'name' => 'CNR'],
            ['code' => 1409645498, 'name' => 'EER'],
            ['code' => 1509645371, 'name' => 'SWWR'],
            ['code' => 1707195752, 'name' => 'CWR'],
            ['code' => 1809645351, 'name' => 'WWR (Assossa)'],
            ['code' => 21, 'name' => 'NAAZ'],
            ['code' => 22, 'name' => 'NER'],
            ['code' => 25, 'name' => 'ethio'],
            ['code' => 26, 'name' => 'NR'],
            ['code' => 27, 'name' => 'NWR'],
            ['code' => 3, 'name' => 'CAAZ'],
            ['code' => 30, 'name' => 'SAAZ'],
            ['code' => 307195845, 'name' => 'SSWR(Wolayta)'],
            ['code' => 34, 'name' => 'SER'],
            ['code' => 35, 'name' => 'SR'],
            ['code' => 37, 'name' => 'SSWR'],
            ['code' => 379442648, 'name' => 'Corporate'],
            ['code' => 4, 'name' => 'CENTRALCREDIT'],
            ['code' => 40, 'name' => 'SWAAZ'],
            ['code' => 41, 'name' => 'SWR'],
            ['code' => 43, 'name' => 'WAAZ'],
            ['code' => 44, 'name' => 'WR'],
            ['code' => 504640899, 'name' => 'SSER'],
            ['code' => 6600, 'name' => 'NNWR (Gondar)_old'],
            ['code' => 6601, 'name' => 'SSWR (Wolayta)_old'],
            ['code' => 6602, 'name' => 'CNAAR'],
            ['code' => 6603, 'name' => 'CWAAR (Ambo)_old'],
            ['code' => 6604, 'name' => 'EER (Harar)_old'],
            ['code' => 7, 'name' => 'EAAZ'],
            ['code' => 8, 'name' => 'Enterprise(TPO Building)'],
            ['code' => 9, 'name' => 'ER'],
            ['code' => 907195665, 'name' => 'NNWR'],
            ['code' => 909645455, 'name' => 'GAMBELLA'],
        ];

        DB::table('ethio_zones')->insert($zones);
    }
}
