<?php

namespace App\Filament\Resources\BandwidthPrices\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class BandwidthPriceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('bandwidth_value')
                    ->label('Bandwidth Value')
                    ->placeholder('e.g. 10M, 1Gbps')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(50),
                TextInput::make('price')
                    ->label('Monthly Price')
                    ->numeric()
                    ->required()
                    ->minValue(0)
                    ->step(0.01)
                    ->prefix('ETB'),
                TextInput::make('currency')
                    ->label('Currency')
                    ->default('ETB')
                    ->maxLength(10),
            ]);
    }
}
