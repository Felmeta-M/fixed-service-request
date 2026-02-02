<?php

namespace App\Filament\Resources\EthioZones\Pages;

use App\Filament\Resources\EthioZones\EthioZoneResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListEthioZones extends ListRecords
{
    protected static string $resource = EthioZoneResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
