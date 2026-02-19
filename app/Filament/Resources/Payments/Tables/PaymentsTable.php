<?php

namespace App\Filament\Resources\Payments\Tables;

use App\Models\Payment;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class PaymentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->sortable()
                    ->searchable(),
                TextColumn::make('customer_code')
                    ->label('Customer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('customer_survey_order_id')
                    ->label('Survey Order')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('customer_subscription_order_id')
                    ->label('Subscription Order')
                    ->searchable()
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('total_amount')
                    ->label('Amount')
                    ->money('ETB', 0, true)
                    ->sortable(),
                TextColumn::make('trans_id')
                    ->label('Transaction ID')
                    ->searchable()
                    ->placeholder('-')
                    ->copyable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (int $state): string => match ($state) {
                        Payment::STATUS_PAID => 'Paid',
                        Payment::STATUS_PENDING => 'Pending',
                        Payment::STATUS_FAILED => 'Failed',
                        Payment::STATUS_CANCELLED => 'Cancelled',
                        default => 'Unknown',
                    })
                    ->color(fn (int $state): string => match ($state) {
                        Payment::STATUS_PAID => 'success',
                        Payment::STATUS_PENDING => 'warning',
                        Payment::STATUS_FAILED => 'danger',
                        Payment::STATUS_CANCELLED => 'gray',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('service_number')
                    ->label('Service No.')
                    ->searchable()
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),
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
            ->filters([
                TrashedFilter::make(),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}
