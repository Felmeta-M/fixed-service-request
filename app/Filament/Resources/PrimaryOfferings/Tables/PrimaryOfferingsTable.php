<?php

namespace App\Filament\Resources\PrimaryOfferings\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PrimaryOfferingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('offering_id')
                    ->searchable(),
                TextColumn::make('offering_name')
                    ->searchable(),
                TextColumn::make('offering_short_name')
                    ->searchable(),
                TextColumn::make('network_type')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('effective_date')
                    ->searchable(),
                TextColumn::make('expire_date')
                    ->searchable(),
                TextColumn::make('monthly_cost')
                    ->money()
                    ->sortable(),
                TextColumn::make('one_time_cost')
                    ->money()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
