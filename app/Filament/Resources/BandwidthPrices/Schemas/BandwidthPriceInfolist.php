<?php

namespace App\Filament\Resources\BandwidthPrices\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class BandwidthPriceInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('bandwidth_value')
                    ->label('Bandwidth Value'),
                TextEntry::make('price')
                    ->label('Monthly Price')
                    ->money('ETB'),
                TextEntry::make('currency')
                    ->label('Currency'),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}
