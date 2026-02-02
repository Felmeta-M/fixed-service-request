<?php

namespace App\Filament\Resources\PrimaryOfferings\Pages;

use App\Filament\Resources\PrimaryOfferings\PrimaryOfferingResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPrimaryOfferings extends ListRecords
{
    protected static string $resource = PrimaryOfferingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
