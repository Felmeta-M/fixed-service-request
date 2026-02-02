<?php

namespace App\Filament\Resources\EthioZones\Pages;

use App\Filament\Resources\EthioZones\EthioZoneResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditEthioZone extends EditRecord
{
    protected static string $resource = EthioZoneResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
            ForceDeleteAction::make(),
            RestoreAction::make(),
        ];
    }
}
