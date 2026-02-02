<?php

namespace App\Filament\Resources\TelecomRegions\Pages;

use App\Filament\Resources\TelecomRegions\TelecomRegionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTelecomRegions extends ListRecords
{
    protected static string $resource = TelecomRegionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
