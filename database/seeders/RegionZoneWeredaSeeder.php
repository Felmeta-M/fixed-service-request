<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class RegionZoneWeredaSeeder extends Seeder
{
    private const CHUNK_SIZE = 500;

    public function run(): void
    {
        $path = database_path('address_hierarchy_final.csv');

        if (!file_exists($path)) {
            $this->command->error('CSV file not found.');
            return;
        }

        $headers = [
            'region_id',
            'region_name',
            'zone_id',
            'zone_name',
            'wereda_id',
            'wereda_name',
            'zone_code'
        ];

        $regions = [];
        $zones = [];
        $weredas = [];

        $now = now();
        $skipped = 0;
        $rowNumber = 0;

        if (($file = fopen($path, 'r')) === false) {
            $this->command->error('Failed to open CSV file.');
            return;
        }

        // Skip header row
        fgetcsv($file);

        while (($row = fgetcsv($file)) !== false) {
            $rowNumber++;

            try {
                // Normalize row length
                $row = array_slice(array_pad($row, count($headers), null), 0, count($headers));
                $data = array_combine($headers, $row);

                // Validate IDs
                $regionId = filter_var(trim($data['region_id']), FILTER_VALIDATE_INT);
                $zoneId   = filter_var(trim($data['zone_id']), FILTER_VALIDATE_INT);
                $weredaId = filter_var(trim($data['wereda_id']), FILTER_VALIDATE_INT);

                if ($regionId === false || $zoneId === false || $weredaId === false) {
                    throw new \Exception('Invalid numeric IDs');
                }

                // Clean text values
                $regionName = $this->cleanName($data['region_name']);
                $zoneName   = $this->cleanName($data['zone_name']);
                $weredaName = $this->cleanName($data['wereda_name']);


                $zoneCode = !empty(trim($data['zone_code'] ?? ''))
                    ? strtoupper(trim($data['zone_code']))
                    : null;

                /*
                 |--------------------------------------------------------------------------
                 | Regions
                 |--------------------------------------------------------------------------
                 */
                if (!isset($regions[$regionId])) {
                    $regions[$regionId] = [
                        'id' => $regionId,
                        'name' => $regionName,
                        'status' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                /*
                 |--------------------------------------------------------------------------
                 | Zones
                 |--------------------------------------------------------------------------
                 */
                if (!isset($zones[$zoneId])) {
                    $zones[$zoneId] = [
                        'id' => $zoneId,
                        'region_id' => $regionId,
                        'name' => $zoneName,
                        'zone_code' => $zoneCode,
                        'status' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                /*
                 |--------------------------------------------------------------------------
                 | Weredas
                 |--------------------------------------------------------------------------
                 */
                if (!isset($weredas[$weredaId])) {
                    $weredas[$weredaId] = [
                        'id' => $weredaId,
                        'zone_id' => $zoneId,
                        'region_id' => $regionId,
                        'name' => $weredaName,
                        'status' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            } catch (Throwable $e) {
                $skipped++;

                Log::warning("Seeder row skipped at {$rowNumber}: {$e->getMessage()}");

                continue;
            }
        }

        fclose($file);

        // Insert using transaction
        DB::transaction(function () use ($regions, $zones, $weredas) {

            $this->upsert('regions', $regions, ['id'], ['name', 'status', 'updated_at']);

            $this->upsert('zones', $zones, ['id'], [
                'name',
                'region_id',
                'zone_code',
                'status',
                'updated_at'
            ]);

            $this->upsert('weredas', $weredas, ['id'], [
                'name',
                'zone_id',
                'region_id',
                'status',
                'updated_at'
            ]);
        });

        $this->command->info('Regions: ' . count($regions));
        $this->command->info('Zones: ' . count($zones));
        $this->command->info('Weredas: ' . count($weredas));
        $this->command->info("Skipped rows: {$skipped}");
    }

    private function upsert(string $table, array $data, array $uniqueBy, array $updateColumns): void
    {
        foreach (array_chunk(array_values($data), self::CHUNK_SIZE) as $chunk) {
            DB::table($table)->upsert($chunk, $uniqueBy, $updateColumns);
        }
    }

    private function cleanName(?string $value): string
    {
        return Str::of($value ?? '')
            ->replace('/', ' ')          // Replace all slashes with space
            ->replaceMatches('/\s+/', ' ') // Remove multiple spaces
            ->trim()
            ->title();                  // Proper case
    }
}
