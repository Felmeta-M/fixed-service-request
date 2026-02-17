<?php

namespace App\Console\Commands;

use App\Models\AvailableDevice;
use Illuminate\Console\Command;

/**
 * Run: php artisan available-devices:diagnose
 * Use this to see the real exception when /fbb/available-devices returns 500.
 */
class DiagnoseAvailableDevicesPage extends Command
{
    protected $signature = 'available-devices:diagnose';

    protected $description = 'Reproduce loading AvailableDevice list to capture the real 500 error';

    public function handle(): int
    {
        $this->info('Diagnosing Available Devices list page...');

        try {
            $this->info('1. Loading AvailableDevice model...');
            $count = AvailableDevice::query()->count();
            $this->info("   OK - {$count} record(s).");

            $this->info('2. Loading first record with all attributes...');
            $first = AvailableDevice::query()->first();
            if ($first) {
                $this->info('   Reading attributes...');
                $first->name;
                $first->vendor;
                $first->price;
                $first->specifications;
                $first->image_url;
                $first->is_active;
                $this->info('   OK.');
            }

            $this->info('3. Building Filament table (same as list page)...');
            $resource = \App\Filament\Resources\AvailableDevices\AvailableDeviceResource::class;
            $livewire = new \App\Filament\Resources\AvailableDevices\Pages\ListAvailableDevices($resource);
            $table = $resource::table(\Filament\Tables\Table::make($livewire));
            $this->info('   Table built OK.');

            $this->info('All checks passed. If the page still returns 500, the error may occur during Livewire render or in middleware.');
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Error: ' . $e->getMessage());
            $this->line($e->getFile() . ':' . $e->getLine());
            $this->newLine();
            $this->line('Stack trace:');
            $this->line($e->getTraceAsString());
            return self::FAILURE;
        }
    }
}
