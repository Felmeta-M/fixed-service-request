<?php

namespace App\Filament\Resources\BandwidthOptions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class BandwidthOptionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('residential_options')
                    ->label('Residential Options')
                    ->formatStateUsing(fn($state) => is_array($state) ? implode(', ', $state) : $state)
                    ->searchable()
                    ->sortable(),
                TextColumn::make('enterprise_options')
                    ->label('Enterprise Options')
                    ->formatStateUsing(fn($state) => is_array($state) ? implode(', ', $state) : $state)
                    ->searchable()
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
