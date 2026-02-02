<?php

namespace App\Filament\Resources\TroubleTickets\Pages;

use App\Filament\Resources\TroubleTickets\TroubleTicketResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTroubleTickets extends ListRecords
{
    protected static string $resource = TroubleTicketResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
