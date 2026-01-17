<?php

namespace Database\Seeders;

use App\Models\EthioZonalArea;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EthioZonalAreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = database_path('area_list.csv');
        
        if (!file_exists($path)) {
            $this->command->error("CSV file not found: {$path}");
            return;
        }

        $file = fopen($path, 'r');
        if (!$file) {
            $this->command->error("Unable to open CSV file: {$path}");
            return;
        }

        // Read header row
        $header = array_map('trim', fgetcsv($file));
        if (!$header || !in_array('area_code', $header) || !in_array('area_name', $header)) {
            $this->command->error("Invalid CSV header. Expected: area_code, area_name, description");
            fclose($file);
            return;
        }

        $rows = [];
        while (($row = fgetcsv($file)) !== false) {
            $rows[] = $row;
        }
        fclose($file);

        $bar = $this->command->getOutput()->createProgressBar(count($rows));
        $bar->start();

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            // Skip empty rows
            if (empty(array_filter($row))) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Combine header with row data
            $record = [];
            foreach ($header as $index => $key) {
                $record[$key] = isset($row[$index]) ? trim($row[$index]) : '';
            }

            // Skip if required fields are empty
            if (empty($record['area_code']) || empty($record['area_name'])) {
                $skipped++;
                $bar->advance();
                continue;
            }

            $existing = EthioZonalArea::where('area_code', $record['area_code'])->first();
            
            if ($existing) {
                $existing->update([
                    'area_name' => $record['area_name'],
                    'description' => !empty($record['description']) ? $record['description'] : null,
                ]);
                $updated++;
            } else {
                EthioZonalArea::create([
                    'area_code' => $record['area_code'],
                    'area_name' => $record['area_name'],
                    'description' => !empty($record['description']) ? $record['description'] : null,
                ]);
                $created++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->command->newLine();
        $this->command->info("Ethio zonal areas seeded successfully. Created: {$created}, Updated: {$updated}, Skipped: {$skipped}");
    }
}
