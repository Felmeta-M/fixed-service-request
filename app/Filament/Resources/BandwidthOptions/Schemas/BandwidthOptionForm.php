<?php

namespace App\Filament\Resources\BandwidthOptions\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class BandwidthOptionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('residential_options'),
                TextInput::make('enterprise_options'),
            ]);
    }
}
