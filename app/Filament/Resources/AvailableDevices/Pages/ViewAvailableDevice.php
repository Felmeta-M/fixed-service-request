<?php

namespace App\Filament\Resources\AvailableDevices\Pages;

use App\Filament\Resources\AvailableDevices\AvailableDeviceResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewAvailableDevice extends ViewRecord
{
    protected static string $resource = AvailableDeviceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
