<?php

namespace App\Filament\Resources\AvailableDevices\Schemas;

use App\Models\AvailableDevice;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class AvailableDeviceInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('id')
                    ->label('ID'),
                TextEntry::make('name'),
                TextEntry::make('vendor'),
                TextEntry::make('model')
                    ->placeholder('-'),
                TextEntry::make('price')
                    ->money('ETB', 0, true),
                TextEntry::make('description')
                    ->placeholder('-')
                    ->columnSpanFull(),
                ImageEntry::make('image_url')
                    ->placeholder('-'),
                TextEntry::make('stock_quantity')
                    ->numeric(),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('deleted_at')
                    ->dateTime()
                    ->visible(fn (AvailableDevice $record): bool => $record->trashed()),
                TextEntry::make('device_type'),
                IconEntry::make('is_active')
                    ->boolean(),
                TextEntry::make('media_type'),
            ]);
    }
}
