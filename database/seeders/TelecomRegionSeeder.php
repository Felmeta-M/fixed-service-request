<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TelecomRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds the telecom_regions table from area_list.csv
     */
    public function run(): void
    {
        // Use CSV import method to populate telecom_regions table
        $this->seedFromCsv();
    }

    /**
     * Seed from CSV file.
     * CSV file should be in database/ directory with columns: area_code, area_name, zone_name
     * Maps to telecom_regions table: area_id, area_name, zone
     */
    private function seedFromCsv(): void
    {
        $path = database_path('area_list.csv');

        if (!file_exists($path)) {
            $this->command->warn("CSV file not found at: {$path}");
            return;
        }

        $data = array_map('str_getcsv', file($path));
        $header = array_map('trim', array_shift($data));

        $areas = [];
        foreach ($data as $row) {
            if (count($row) !== count($header)) {
                continue; // Skip malformed rows
            }

            $record = array_combine($header, $row);

            $areas[] = [
                'area_id' => (string) $record['area_code'], // Convert to string to match telecom_regions structure
                'area_name' => trim($record['area_name']),
                'zone' => isset($record['zone_name']) ? trim($record['zone_name']) : null,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Use upsert to avoid duplicates (based on area_id)
        $chunks = array_chunk($areas, 500);
        foreach ($chunks as $chunk) {
            DB::table('telecom_regions')->upsert(
                $chunk,
                ['area_id'], // Unique key
                ['area_name', 'zone', 'status', 'updated_at'] // Columns to update if duplicate
            );
        }

        $this->command->info('Seeded ' . count($areas) . ' areas from CSV into telecom_regions table.');
    }
}
