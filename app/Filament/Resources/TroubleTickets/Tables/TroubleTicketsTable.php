<?php

namespace App\Filament\Resources\TroubleTickets\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class TroubleTicketsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('tt_serial_no')
                    ->label('TT Serial No')
                    ->searchable(),
                TextColumn::make('access_number')
                    ->searchable(),
                TextColumn::make('contact_person')
                    ->searchable(),
                TextColumn::make('mobile_no')
                    ->searchable(),
                TextColumn::make('trouble_title')
                    ->searchable(),
                TextColumn::make('trouble_reason')
                    ->searchable(),
                TextColumn::make('status')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('last_synced_status')
                    ->searchable(),
                TextColumn::make('last_checked_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('deleted_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('service_owner_code')
                    ->searchable(),
                TextColumn::make('service_owner_name')
                    ->searchable(),
                TextColumn::make('service_owner_type')
                    ->searchable(),
                TextColumn::make('service_owner_level')
                    ->searchable(),
                TextColumn::make('region')
                    ->searchable(),
                TextColumn::make('zone')
                    ->searchable(),
                TextColumn::make('city')
                    ->searchable(),
                TextColumn::make('sub_city')
                    ->searchable(),
                TextColumn::make('wereda')
                    ->searchable(),
                TextColumn::make('kebele')
                    ->searchable(),
                TextColumn::make('house_no')
                    ->searchable(),
            ])
            ->recordUrl(null)
            ->defaultSort('created_at', 'desc')
            ->filters([
                TrashedFilter::make(),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    // DeleteBulkAction::make(),
                    // ForceDeleteBulkAction::make(),
                    // RestoreBulkAction::make(),
                ]),
            ]);
    }
}
