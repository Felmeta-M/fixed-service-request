<?php

namespace App\Filament\Resources\BandwidthPrices\Pages;

use App\Filament\Resources\BandwidthPrices\BandwidthPriceResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Cache;

class CreateBandwidthPrice extends CreateRecord
{
    protected static string $resource = BandwidthPriceResource::class;

    protected function afterCreate(): void
    {
        Cache::forget('bandwidth_prices:all');
    }
}
