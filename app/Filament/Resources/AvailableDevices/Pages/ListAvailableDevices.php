<?php

namespace App\Filament\Resources\AvailableDevices\Pages;

use App\Filament\Resources\AvailableDevices\AvailableDeviceResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAvailableDevices extends ListRecords
{
    protected static string $resource = AvailableDeviceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
