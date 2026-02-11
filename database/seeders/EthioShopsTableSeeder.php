<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EthioShopsTableSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('ethio_shops.csv');

        if (!file_exists($path)) {
            $this->command->warn("CSV not found: {$path}");

            return;
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);
        $now = now();
        $shops = [];

        $skipped = 0;
        $seenShopNames = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 6) {
                $skipped++;
                continue;
            }
            $shopName = Str::of($row[3] ?? '')->trim()->toString();
            if (isset($seenShopNames[$shopName])) {
                $skipped++;
                continue;
            }
            $seenShopNames[$shopName] = true;

            $latRaw = trim((string) ($row[4] ?? ''));
            $lngRaw = trim((string) ($row[5] ?? ''));
            if ($latRaw === '' || $lngRaw === '') {
                $skipped++;
                continue;
            }
            $lat = (float) $latRaw;
            $lng = (float) $lngRaw;
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                $skipped++;
                continue;
            }
            $shops[] = [
                'zone' => Str::of($row[0] ?? '')->trim()->toString(),
                'center_name' => Str::of($row[1] ?? '')->trim()->toString(),
                'building_name' => Str::of($row[2] ?? '')->trim()->toString(),
                'shop_name' => $shopName,
                'latitude' => $lat,
                'longitude' => $lng,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        fclose($handle);

        if (!empty($shops)) {
            DB::table('ethio_shops')->insert($shops);
            $this->command->info('Inserted ' . count($shops) . ' ethio_shops from CSV.');
        }
        if ($skipped > 0) {
            $this->command->warn("Skipped {$skipped} row(s) (duplicate shop_name, empty/invalid coordinates, or invalid range).");
        }
    }
}
