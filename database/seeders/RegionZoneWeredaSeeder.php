<?php

namespace Database\Seeders;

use App\Models\Region;
use App\Models\Wereda;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RegionZoneWeredaSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('Address_Hierarchy _listed.csv');
        if (!is_readable($path)) {
            $this->command?->error("CSV not found: {$path}");
            return;
        }

        // CSV lines 1072–1788 (SNNP, Benshangul, Somali, Afar, Hareri, Diredawa, Sidama, South West, Central/South Ethiopia); no truncate
        $rows = $this->readCsv($path, 1072, 1788);
        if (empty($rows)) {
            $this->command?->warn('No rows in CSV range 1072–1788.');
            return;
        }

        Model::unguarded(function () use ($rows) {
            foreach ($rows as $record) {
                $regionId = (int) $record['region_id'];
                $zoneId = (int) $record['zone_id'];
                $weredaId = (int) $record['wereda_id'];

                $region = Region::updateOrCreate(
                    ['id' => $regionId],
                    ['name' => Str::title(trim($record['region_name'] ?? ''))]
                );

                $zone = Zone::updateOrCreate(
                    ['id' => $zoneId],
                    [
                        'name' => Str::title(trim($record['zone_name'] ?? '')),
                        'region_id' => $region->id,
                    ]
                );

                Wereda::updateOrCreate(
                    ['id' => $weredaId],
                    [
                        'name' => Str::title(trim($record['wereda_name'] ?? '')),
                        'region_id' => $region->id,
                        'zone_id' => $zone->id,
                    ]
                );
            }
        });

        $this->command?->info('Seeded CSV 1072–1788 (no truncate): ' . count($rows) . ' rows → ' . Region::count() . ' regions, ' . Zone::count() . ' zones, ' . Wereda::count() . ' weredas total.');
    }

    /** @param int|null $startLine 1-based inclusive, $endLine 1-based inclusive */
    private function readCsv(string $path, ?int $startLine = null, ?int $endLine = null): array
    {
        $rows = [];
        $handle = fopen($path, 'r');
        if (!$handle) {
            return $rows;
        }

        $header = array_map('trim', (array) fgetcsv($handle));
        $n = count($header);
        $lineNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;
            if ($startLine !== null && $lineNumber < $startLine) {
                continue;
            }
            if ($endLine !== null && $lineNumber > $endLine) {
                break;
            }

            $row = array_map('trim', $row);
            $row = count($row) < $n ? array_pad($row, $n, '') : array_slice($row, 0, $n);
            $record = array_combine($header, $row);
            if (trim($record['region_id'] ?? '') === '' || trim($record['zone_id'] ?? '') === '' || trim($record['wereda_id'] ?? '') === '') {
                continue;
            }
            $rows[] = $record;
        }

        fclose($handle);
        return $rows;
    }
}
