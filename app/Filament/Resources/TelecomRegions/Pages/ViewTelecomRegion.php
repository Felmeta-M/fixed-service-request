<?php

namespace App\Filament\Resources\TelecomRegions\Pages;

use App\Filament\Resources\TelecomRegions\TelecomRegionResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewTelecomRegion extends ViewRecord
{
    protected static string $resource = TelecomRegionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
