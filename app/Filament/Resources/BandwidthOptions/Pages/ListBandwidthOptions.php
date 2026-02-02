<?php

namespace App\Filament\Resources\BandwidthOptions\Pages;

use App\Filament\Resources\BandwidthOptions\BandwidthOptionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBandwidthOptions extends ListRecords
{
    protected static string $resource = BandwidthOptionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
