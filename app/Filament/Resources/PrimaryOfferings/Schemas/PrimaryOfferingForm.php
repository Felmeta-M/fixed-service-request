<?php

namespace App\Filament\Resources\PrimaryOfferings\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PrimaryOfferingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('offering_id')
                    ->required(),
                TextInput::make('offering_name')
                    ->required(),
                TextInput::make('offering_short_name'),
                TextInput::make('network_type')
                    ->numeric(),
                TextInput::make('effective_date'),
                TextInput::make('expire_date'),
                TextInput::make('monthly_cost')
                    ->numeric()
                    ->prefix('$'),
                TextInput::make('one_time_cost')
                    ->numeric()
                    ->prefix('$'),
            ]);
    }
}
