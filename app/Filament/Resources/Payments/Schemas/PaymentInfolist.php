<?php

namespace App\Filament\Resources\Payments\Schemas;

use App\Models\Payment;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class PaymentInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('id')
                    ->label('ID'),
                TextEntry::make('customer_code')
                    ->label('Customer Code')
                    ->copyable(),
                TextEntry::make('customer_survey_order_id')
                    ->label('Survey Order ID')
                    ->placeholder('-')
                    ->copyable(),
                TextEntry::make('customer_subscription_order_id')
                    ->label('Subscription Order ID')
                    ->placeholder('-')
                    ->copyable(),
                TextEntry::make('total_amount')
                    ->label('Amount')
                    ->money('ETB', 0, true),
                TextEntry::make('trans_id')
                    ->label('Transaction ID')
                    ->placeholder('-')
                    ->copyable(),
                TextEntry::make('status')
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
                    }),
                TextEntry::make('service_number')
                    ->label('Service Number')
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->label('Created')
                    ->dateTime(),
                TextEntry::make('updated_at')
                    ->label('Updated')
                    ->dateTime(),
            ]);
    }
}
