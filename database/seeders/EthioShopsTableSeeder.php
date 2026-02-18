<?php

namespace Database\Seeders;

use App\Models\TelecomRegion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EthioShopsTableSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('ethio_shops_v3.csv');

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
            // CSV: zone, area_id, area_name, building_name, specific_location, latitude, longitude
            if (count($row) < 5) {
                $skipped++;
                continue;
            }
            $shopName = Str::of($row[2] ?? '')->trim()->toString();
            if ($shopName === '') {
                $skipped++;
                continue;
            }
            if (isset($seenShopNames[$shopName])) {
                $skipped++;
                continue;
            }
            $seenShopNames[$shopName] = true;

            $latRaw = trim((string) ($row[5] ?? ''));
            $lngRaw = trim((string) ($row[6] ?? ''));
            $lat = null;
            $lng = null;
            if ($latRaw !== '' && $lngRaw !== '') {
                $lat = (float) $latRaw;
                $lng = (float) $lngRaw;
                if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                    $lat = null;
                    $lng = null;
                }
            }

            $areaId = isset($row[1]) && $row[1] !== '' ? (int) $row[1] : null;

            $shops[] = [
                'zone' => Str::of($row[0] ?? '')->trim()->toString(),
                'area_id' => $areaId,
                'area_name' => $shopName,
                'building_name' => Str::of($row[3] ?? '')->trim()->toString(),
                'specific_location' => isset($row[4]) && trim((string) $row[4]) !== '' ? Str::of($row[4])->trim()->toString() : null,
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
            $this->backfillAreaIdFromTelecomRegions();
        }
        if ($skipped > 0) {
            $this->command->warn("Skipped {$skipped} row(s) (duplicate area_name, empty/invalid coordinates, or invalid range).");
        }
    }

    /**
     * Set ethio_shops.area_id from telecom_regions where zone matches (for use as telecom_region).
     */
    private function backfillAreaIdFromTelecomRegions(): void
    {
        $regionsByZone = TelecomRegion::active()
            ->get()
            ->groupBy(fn($r) => strtolower(trim($r->zone)));

        $updated = 0;
        foreach (DB::table('ethio_shops')->get() as $shop) {
            $zoneKey = strtolower(trim((string) $shop->zone));
            if ($zoneKey === '') {
                continue;
            }
            $region = $regionsByZone->get($zoneKey)?->first();
            if (!$region || $shop->area_id !== null) {
                continue;
            }
            DB::table('ethio_shops')->where('id', $shop->id)->update(['area_id' => $region->area_id]);
            $updated++;
        }
        if ($updated > 0) {
            $this->command->info("Backfilled area_id for {$updated} ethio_shop(s) from telecom_regions.");
        }
    }
}
