<?php

namespace App\Filament\Resources\AvailableDevices\Pages;

use App\Filament\Resources\AvailableDevices\AvailableDeviceResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditAvailableDevice extends EditRecord
{
    protected static string $resource = AvailableDeviceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            // DeleteAction::make(),
            // ForceDeleteAction::make(),
            // RestoreAction::make(),
        ];
    }
}
