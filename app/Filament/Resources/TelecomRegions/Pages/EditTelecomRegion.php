<?php

namespace App\Filament\Resources\TelecomRegions\Pages;

use App\Filament\Resources\TelecomRegions\TelecomRegionResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditTelecomRegion extends EditRecord
{
    protected static string $resource = TelecomRegionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
