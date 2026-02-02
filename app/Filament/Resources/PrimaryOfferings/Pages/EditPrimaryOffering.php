<?php

namespace App\Filament\Resources\PrimaryOfferings\Pages;

use App\Filament\Resources\PrimaryOfferings\PrimaryOfferingResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditPrimaryOffering extends EditRecord
{
    protected static string $resource = PrimaryOfferingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
