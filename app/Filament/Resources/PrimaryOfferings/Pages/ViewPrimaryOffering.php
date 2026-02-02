<?php

namespace App\Filament\Resources\PrimaryOfferings\Pages;

use App\Filament\Resources\PrimaryOfferings\PrimaryOfferingResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewPrimaryOffering extends ViewRecord
{
    protected static string $resource = PrimaryOfferingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
