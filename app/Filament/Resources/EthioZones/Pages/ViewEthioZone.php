<?php

namespace App\Filament\Resources\EthioZones\Pages;

use App\Filament\Resources\EthioZones\EthioZoneResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewEthioZone extends ViewRecord
{
    protected static string $resource = EthioZoneResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
