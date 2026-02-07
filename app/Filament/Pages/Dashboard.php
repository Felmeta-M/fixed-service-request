<?php

namespace App\Filament\Pages;

use Filament\Forms\Components\DatePicker;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class Dashboard extends BaseDashboard
{
    use HasFiltersForm;

    public function filtersForm(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Section::make('Date range')
                    ->description('Filter survey order stats by date')
                    ->schema([
                        DatePicker::make('date_from')
                            ->label('From date')
                            ->native(false),
                        DatePicker::make('date_to')
                            ->label('To date')
                            ->native(false),
                    ])
                    ->columns(2),
            ]);
    }
}
