<?php

namespace App\Filament\Resources\BandwidthPrices\Pages;

use App\Filament\Resources\BandwidthPrices\BandwidthPriceResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBandwidthPrices extends ListRecords
{
    protected static string $resource = BandwidthPriceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
