<?php

namespace App\Filament\Resources\SurveyOrders\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class SurveyOrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('customer_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('customer_code')
                    ->searchable(),
                TextColumn::make('customer_survey_order_id')
                    ->searchable(),
                TextColumn::make('main_offer_id')
                    ->searchable(),
                TextColumn::make('service_number')
                    ->searchable(),
                TextColumn::make('survey_type')
                    ->searchable(),
                TextColumn::make('telecom_region')
                    ->searchable(),
                TextColumn::make('oper_type')
                    ->searchable(),
                TextColumn::make('customer_type')
                    ->searchable(),
                TextColumn::make('bandwidth')
                    ->searchable(),
                TextColumn::make('contact_person')
                    ->searchable(),
                TextColumn::make('contact_no')
                    ->searchable(),
                TextColumn::make('contact_email')
                    ->searchable(),
                TextColumn::make('sec_contact_person')
                    ->searchable(),
                TextColumn::make('sec_contact_no')
                    ->searchable(),
                TextColumn::make('sec_contact_email')
                    ->searchable(),
                TextColumn::make('status')
                    ->searchable(),
                TextColumn::make('completed_date')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('subscribed_at')
                    ->dateTime()
                    ->sortable(),
                IconColumn::make('survey_is_manual')
                    ->boolean(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('deleted_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('cable_length')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('cable_type')
                    ->searchable(),
                TextColumn::make('cable_charge')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('lat')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('long')
                    ->numeric()
                    ->sortable(),
                IconColumn::make('with_device')
                    ->boolean(),
                TextColumn::make('device_id'),
                TextColumn::make('device_voice_id'),
                TextColumn::make('last_synced_status')
                    ->searchable(),
                TextColumn::make('last_checked_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('customer_subscription_order_id')
                    ->searchable(),
                TextColumn::make('fbb_service_number')
                    ->searchable(),
                TextColumn::make('area_code')
                    ->searchable(),
                TextColumn::make('area_name')
                    ->searchable(),
                TextColumn::make('internet_account')
                    ->searchable(),
                TextColumn::make('media_type')
                    ->searchable(),
                TextColumn::make('line_indicator')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('survey_failure_reason')
                    ->searchable(),
                TextColumn::make('zone_code')
                    ->searchable(),
            ])
            ->filters([
                TrashedFilter::make(),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    ForceDeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }
}
