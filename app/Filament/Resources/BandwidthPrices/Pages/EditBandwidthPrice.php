<?php

namespace App\Filament\Resources\BandwidthPrices\Pages;

use App\Filament\Resources\BandwidthPrices\BandwidthPriceResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Cache;

class EditBandwidthPrice extends EditRecord
{
    protected static string $resource = BandwidthPriceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }

    protected function afterSave(): void
    {
        Cache::forget('bandwidth_prices:all');
    }
}
