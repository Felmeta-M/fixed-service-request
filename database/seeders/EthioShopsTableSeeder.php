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
            $this->backfillAreaIdFromTelecomRegions();
        }
        if ($skipped > 0) {
            $this->command->warn("Skipped {$skipped} row(s) (duplicate shop_name, empty/invalid coordinates, or invalid range).");
        }
    }

    /**
     * Set ethio_shops.area_id from telecom_regions where zone matches (for use as telecom_region).
     */
    private function backfillAreaIdFromTelecomRegions(): void
    {
        $regionsByZone = TelecomRegion::active()
            ->get()
            ->groupBy(fn ($r) => strtolower(trim($r->zone)));

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
