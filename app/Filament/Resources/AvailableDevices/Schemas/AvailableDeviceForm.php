<?php

namespace App\Filament\Resources\AvailableDevices\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class AvailableDeviceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('vendor')
                    ->required(),
                TextInput::make('model'),
                TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->prefix('ETB'),
                Textarea::make('description')
                    ->columnSpanFull(),
                FileUpload::make('image_url')
                    ->image(),
                TextInput::make('stock_quantity')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('specifications'),
                TextInput::make('device_type')
                    ->required()
                    ->default('broadband'),
                Toggle::make('is_active')
                    ->required(),
                TextInput::make('media_type')
                    ->required()
                    ->default('UNIVERSAL'),
            ]);
    }
}
