<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NumberPoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds the number_pools table with zone and area_id mappings.
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
     * Zone and dept_id pairs from the number pool dataset.
     *
     * @return array<int, array{string, int}>
     */
    private function getNumberPoolData(): array
    {
        return [
            ['EAAZ', 1049],
            ['EAAZ', 1054],
            ['EAAZ', 1064],
            ['EAAZ', 1081],
            ['EAAZ', 1206],
            ['EAAZ', 1318],
            ['EAAZ', 3350],
            ['EAAZ', 3351],
            ['EAAZ', 3352],
            ['EAAZ', 3360],
            ['EAAZ', 3361],
            ['EAAZ', 3367],
            ['EAAZ', 3368],
            ['EAAZ', 3369],
            ['EAAZ', 3370],
            ['EAAZ', 3375],
            ['EAAZ', 3377],
            ['EAAZ', 3378],
            ['EAAZ', 3406],
            ['EAAZ', 3408],
            ['EAAZ', 3429],
            ['EAAZ', 3441],
            ['EAAZ', 3484],
            ['EAAZ', 3493],
            ['EAAZ', 3502],
            ['NAAZ', 1011],
            ['NAAZ', 1114],
            ['NAAZ', 1156],
            ['NAAZ', 3347],
            ['NAAZ', 3348],
            ['NAAZ', 3396],
            ['NAAZ', 3398],
            ['NAAZ', 3404],
            ['NAAZ', 3409],
            ['NAAZ', 3410],
            ['NAAZ', 3422],
            ['NAAZ', 3425],
            ['NAAZ', 3430],
            ['NAAZ', 3433],
            ['NAAZ', 3436],
            ['NAAZ', 3437],
            ['NAAZ', 3439],
            ['NAAZ', 3469],
            ['NAAZ', 3478],
            ['NAAZ', 3483],
            ['NAAZ', 3486],
            ['NAAZ', 3490],
            ['NAAZ', 3515],
            ['NAAZ', 3518],
            ['NAAZ', 7934],
            ['NAAZ', 7977],
            ['NAAZ', 7978],
            ['NAAZ', 8057],
            ['NAAZ', 8058],
            ['NAAZ', 8059],
            ['NAAZ', 11200],
            ['SAAZ', 1159],
            ['SAAZ', 1183],
            ['SAAZ', 1185],
            ['SAAZ', 1190],
            ['SAAZ', 3381],
            ['SAAZ', 3419],
            ['SWAAZ', 1223],
            ['SWAAZ', 3391],
            ['SWAAZ', 3392],
            ['SWAAZ', 3393],
            ['SWAAZ', 3394],
            ['SWAAZ', 3395],
            ['SWAAZ', 3399],
            ['SWAAZ', 3402],
            ['SWAAZ', 3412],
            ['SWAAZ', 3415],
            ['SWAAZ', 3417],
            ['SWAAZ', 3423],
            ['SWAAZ', 3435],
            ['SWAAZ', 3438],
            ['SWAAZ', 3443],
            ['SWAAZ', 3444],
            ['SWAAZ', 3448],
            ['SWAAZ', 3450],
            ['SWAAZ', 3451],
            ['SWAAZ', 3457],
            ['SWAAZ', 3466],
            ['SWAAZ', 3467],
            ['SWAAZ', 3473],
            ['SWAAZ', 3487],
            ['SWAAZ', 3489],
            ['SWAAZ', 3495],
            ['SWAAZ', 3497],
            ['SWAAZ', 3710],
            ['SWAAZ', 7972],
            ['SWAAZ', 7973],
            ['SWAAZ', 7980],
            ['SWAAZ', 11213],
            ['SWAAZ', 11865],
            ['SWAAZ', 11866],
            ['WAAZ', 1261],
            ['WAAZ', 1262],
            ['WAAZ', 1266],
            ['WAAZ', 1273],
            ['WAAZ', 1281],
            ['WAAZ', 1284],
            ['WAAZ', 1285],
            ['WAAZ', 1286],
            ['WAAZ', 1293],
            ['WAAZ', 1304],
            ['WAAZ', 1310],
            ['WAAZ', 1316],
            ['WAAZ', 1317],
            ['WAAZ', 1320],
            ['WAAZ', 3390],
            ['WAAZ', 3400],
            ['WAAZ', 3401],
            ['WAAZ', 3416],
            ['WAAZ', 3418],
            ['WAAZ', 3440],
            ['WAAZ', 3517],
            ['WAAZ', 4026],
            ['WAAZ', 7979],
            ['WAAZ', 8000],
        ];
    }
}
