<?php

namespace App\Filament\Resources\Payments\Tables;

use App\Models\Payment;
use App\Filament\Resources\Payments\Exports\PaymentExporter;
use Filament\Actions\ExportAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
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
                TextColumn::make('survey_request.contact_person')
                    ->label('Contact Person')
                    ->searchable()
                    ->placeholder('-'),
                TextColumn::make('survey_request.contact_no')
                    ->label('Contact No.')
                    ->searchable()
                    ->placeholder('-'),
                TextColumn::make('survey_request.contact_email')
                    ->label('Contact Email')
                    ->searchable()
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),
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
                    ->money('ETB', divideBy: 0, decimalPlaces: 0)
                    ->placeholder('-')
                    ->sortable(),
                TextColumn::make('trans_id')
                    ->label('Transaction ID')
                    ->searchable()
                    ->placeholder('-')
                    ->copyable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(function (mixed $state): string {
                        $status = (int) $state;
                        return match ($status) {
                            Payment::STATUS_PAID => 'Paid',
                            Payment::STATUS_PENDING => 'Pending',
                            Payment::STATUS_FAILED => 'Failed',
                            Payment::STATUS_CANCELLED => 'Cancelled',
                            default => 'Unknown',
                        };
                    })
                    ->color(function (mixed $state): string {
                        $status = (int) $state;
                        return match ($status) {
                            Payment::STATUS_PAID => 'success',
                            Payment::STATUS_PENDING => 'warning',
                            Payment::STATUS_FAILED => 'danger',
                            Payment::STATUS_CANCELLED => 'gray',
                            default => 'gray',
                        };
                    })
                    ->sortable(),
                TextColumn::make('service_number')
                    ->label('Service No.')
                    ->searchable()
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('webhook_notified_at')
                    ->label('Webhook At')
                    ->dateTime('M j, Y H:i')
                    ->sortable()
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: false),
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
            ->defaultSort('webhook_notified_at', 'desc')
            ->filters([
                TernaryFilter::make('device')
                    ->label('Device')
                    ->placeholder('All')
                    ->trueLabel('With device')
                    ->falseLabel('Without device')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('device_fee')->where('device_fee', '>', 0),
                        false: fn ($query) => $query->where(fn ($q) => $q->whereNull('device_fee')->orWhere('device_fee', 0)),
                    ),
            ])
            ->headerActions([
                ExportAction::make()
                    ->exporter(PaymentExporter::class),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}
