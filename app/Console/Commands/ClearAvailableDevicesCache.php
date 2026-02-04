<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\v1\AvailableDeviceController;
use Illuminate\Console\Command;

/**
 * Clear the available-devices list cache.
 * Use after changing device stock or data directly in the DB so the API returns fresh data.
 *
 * Usage: php artisan available-devices:clear-cache
 */
class ClearAvailableDevicesCache extends Command
{
    protected $signature = 'available-devices:clear-cache';

    protected $description = 'Clear the available-devices list cache (e.g. after changing stock in DB)';

    public function handle(): int
    {
        AvailableDeviceController::clearCache();
        $this->info('Available devices cache cleared. Next API request will return fresh data.');

        return self::SUCCESS;
    }
}
