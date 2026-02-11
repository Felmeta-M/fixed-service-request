<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NumberPoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds the number_pools table with zone and Share Resource Dept (dept_id) mappings.
     */
    public function run(): void
    {
        $rows = $this->getNumberPoolData();

        $now = now();
        $records = [];
        $seen = [];

        foreach ($rows as [$zone, $deptId]) {
            $key = "{$zone}:{$deptId}";
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $records[] = [
                'zone' => $zone,
                'dept_id' => $deptId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (empty($records)) {
            return;
        }

        foreach (array_chunk($records, 100) as $chunk) {
            DB::table('number_pools')->upsert(
                $chunk,
                ['zone', 'dept_id'],
                ['updated_at']
            );
        }

        $this->command->info('Seeded ' . count($records) . ' number pool entries.');
    }

    /**
     * Zone and dept_id pairs – Share Resource Dept (BSS dept_id) per zone.
     *
     * @return array<int, array{string, string}>
     */
    private function getNumberPoolData(): array
    {
        return [
            ['AA', '1575030516575167247'],
            ['EAAZ', '1461411242173833602'],
            ['NAAZ', '1461411408673251543'],
            ['Northern AA Zone2', '1461411197664078358'],
            ['SAAZ', '1461411555443227190'],
            ['SWAAZ', '1461411681013814348'],
            ['WAAZ', '1461411761160460302'],
        ];
    }
}
