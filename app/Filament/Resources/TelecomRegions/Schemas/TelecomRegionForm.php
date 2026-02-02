<?php

namespace App\Filament\Resources\TelecomRegions\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class TelecomRegionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('area_id')
                    ->required(),
                TextInput::make('area_name')
                    ->required(),
                TextInput::make('zone'),
                Toggle::make('status')
                    ->required(),
            ]);
    }
}
