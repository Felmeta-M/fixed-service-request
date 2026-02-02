<?php

namespace App\Filament\Resources\TroubleTickets\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class TroubleTicketForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('customer_code')
                    ->required(),
                TextInput::make('access_number')
                    ->required(),
                TextInput::make('contact_person')
                    ->required(),
                TextInput::make('mobile_no')
                    ->required(),
                TextInput::make('trouble_title')
                    ->required(),
                TextInput::make('trouble_reason')
                    ->required(),
                Textarea::make('tt_description')
                    ->columnSpanFull(),
                TextInput::make('tt_serial_no')
                    ->required(),
                TextInput::make('status')
                    ->required()
                    ->default('pending'),
                TextInput::make('last_synced_status'),
                DateTimePicker::make('last_checked_at'),
                TextInput::make('service_owner_code'),
                TextInput::make('service_owner_name'),
                TextInput::make('service_owner_type'),
                TextInput::make('service_owner_level'),
                TextInput::make('region'),
                TextInput::make('zone'),
                TextInput::make('city'),
                TextInput::make('sub_city'),
                TextInput::make('wereda'),
                TextInput::make('kebele'),
                TextInput::make('house_no'),
            ]);
    }
}
