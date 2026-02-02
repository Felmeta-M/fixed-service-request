<?php

namespace App\Filament\Resources\TroubleTickets\Schemas;

use App\Models\TroubleTicket;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class TroubleTicketInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('customer_code'),
                TextEntry::make('access_number'),
                TextEntry::make('contact_person'),
                TextEntry::make('mobile_no'),
                TextEntry::make('trouble_title'),
                TextEntry::make('trouble_reason'),
                TextEntry::make('tt_description')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('tt_serial_no'),
                TextEntry::make('status'),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('last_synced_status')
                    ->placeholder('-'),
                TextEntry::make('last_checked_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('deleted_at')
                    ->dateTime()
                    ->visible(fn (TroubleTicket $record): bool => $record->trashed()),
                TextEntry::make('service_owner_code')
                    ->placeholder('-'),
                TextEntry::make('service_owner_name')
                    ->placeholder('-'),
                TextEntry::make('service_owner_type')
                    ->placeholder('-'),
                TextEntry::make('service_owner_level')
                    ->placeholder('-'),
                TextEntry::make('region')
                    ->placeholder('-'),
                TextEntry::make('zone')
                    ->placeholder('-'),
                TextEntry::make('city')
                    ->placeholder('-'),
                TextEntry::make('sub_city')
                    ->placeholder('-'),
                TextEntry::make('wereda')
                    ->placeholder('-'),
                TextEntry::make('kebele')
                    ->placeholder('-'),
                TextEntry::make('house_no')
                    ->placeholder('-'),
            ]);
    }
}
