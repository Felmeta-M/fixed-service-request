<?php

namespace App\Filament\Resources\BandwidthPrices\Pages;

use App\Filament\Resources\BandwidthPrices\BandwidthPriceResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewBandwidthPrice extends ViewRecord
{
    protected static string $resource = BandwidthPriceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
