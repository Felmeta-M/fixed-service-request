<?php

namespace App\Filament\Resources\TroubleTickets\Pages;

use App\Filament\Resources\TroubleTickets\TroubleTicketResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewTroubleTicket extends ViewRecord
{
    protected static string $resource = TroubleTicketResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
