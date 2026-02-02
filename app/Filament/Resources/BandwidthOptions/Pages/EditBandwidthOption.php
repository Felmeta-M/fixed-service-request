<?php

namespace App\Filament\Resources\BandwidthOptions\Pages;

use App\Filament\Resources\BandwidthOptions\BandwidthOptionResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditBandwidthOption extends EditRecord
{
    protected static string $resource = BandwidthOptionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
