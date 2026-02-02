<?php

namespace App\Filament\Resources\BandwidthOptions\Pages;

use App\Filament\Resources\BandwidthOptions\BandwidthOptionResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewBandwidthOption extends ViewRecord
{
    protected static string $resource = BandwidthOptionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
