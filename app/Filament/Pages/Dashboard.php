<?php

namespace App\Filament\Pages;

use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Filament\Schemas\Components\Actions;
use Filament\Schemas\Schema;

class Dashboard extends BaseDashboard
{
    use HasFiltersForm;

    public function filtersForm(Schema $schema): Schema
    {
        return $schema
            ->columns(3)
            ->components([
                DatePicker::make('date_from')
                    ->label('From date')
                    ->placeholder('Select a date (DD/MM/YYYY)')
                    ->displayFormat('d/m/Y')
                    ->default(now()->startOfMonth()),
                DatePicker::make('date_to')
                    ->label('To date')
                    ->placeholder('Select a date (DD/MM/YYYY)')
                    ->displayFormat('d/m/Y')
                    ->default(now()->endOfMonth()),
                Actions::make([
                    Action::make('clear')
                        ->label('Clear')
                        ->icon('heroicon-o-x-circle')
                        ->color('gray')
                        ->action(function (Dashboard $livewire) {
                            $livewire->filters = null;
                            $livewire->getFiltersForm()->fill();
                        }),
                ])->verticallyAlignEnd(),
            ]);
    }
}
