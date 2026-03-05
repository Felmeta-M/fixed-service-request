<?php

namespace App\Filament\Resources\SurveyOrders\Tables;

use App\Filament\Resources\SurveyOrders\Exports\SurveyOrderExporter;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ExportAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class SurveyOrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('customer_survey_order_id')
                    ->label('Survey Order')
                    ->searchable()
                    ->sortable()
                    ->copyable(),
                TextColumn::make('customer_subscription_order_id')
                    ->label('Subscription Order')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('voice_service_number')
                    ->label('Voice No.')
                    ->searchable()
                    ->placeholder('-'),
                TextColumn::make('data_service_number')
                    ->label('Data No.')
                    ->searchable()
                    ->placeholder('-'),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn($state, $record): string => $record->getDisplayStatusLabel())
                    ->color(fn($state, $record): string => $record->getDisplayStatusColor())
                    ->sortable(),
                TextColumn::make('bandwidth')
                    ->label('Bandwidth')
                    ->formatStateUsing(fn($state) => $state !== null && $state !== '' ? "{$state} MB" : null)
                    ->placeholder('-'),
                TextColumn::make('telecom_region')
                    ->label('Region')
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('survey_is_manual')
                    ->label('Manual')
                    ->boolean(),
                IconColumn::make('with_device')
                    ->label('Device')
                    ->boolean()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('contact_person')
                    ->label('Contact')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('contact_no')
                    ->label('Phone')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('completed_date')
                    ->label('Completed')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->placeholder('-'),
                TextColumn::make('subscribed_at')
                    ->label('Subscribed')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->placeholder('-'),
                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M j, Y H:i')
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->recordUrl(null)
            ->headerActions([
                ExportAction::make()
                    ->exporter(SurveyOrderExporter::class),
            ])
            ->filters([
                TernaryFilter::make('survey_is_manual')
                    ->label('Manual Survey')
                    ->placeholder('All')
                    ->trueLabel('Manual Only')
                    ->falseLabel('Automated Only'),
                TernaryFilter::make('with_device')
                    ->label('With Device')
                    ->placeholder('All')
                    ->trueLabel('With Device')
                    ->falseLabel('Without Device'),
            ])
            ->recordActions([
                ViewAction::make(),
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
