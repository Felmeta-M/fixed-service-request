<?php

namespace App\Filament\Resources\PrimaryOfferings\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class PrimaryOfferingInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('offering_id'),
                TextEntry::make('offering_name'),
                TextEntry::make('offering_short_name')
                    ->placeholder('-'),
                TextEntry::make('network_type')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('effective_date')
                    ->placeholder('-'),
                TextEntry::make('expire_date')
                    ->placeholder('-'),
                TextEntry::make('monthly_cost')
                    ->money()
                    ->placeholder('-'),
                TextEntry::make('one_time_cost')
                    ->money()
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}
