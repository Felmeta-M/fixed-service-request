<?php

namespace App\Filament\Resources\Payments\Schemas;

use App\Models\Payment;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PaymentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('customer_code')
                    ->disabled(),
                TextInput::make('customer_survey_order_id')
                    ->label('Survey Order ID')
                    ->disabled(),
                TextInput::make('customer_subscription_order_id')
                    ->label('Subscription Order ID')
                    ->disabled(),
                TextInput::make('total_amount')
                    ->numeric()
                    ->prefix('ETB')
                    ->disabled(),
                TextInput::make('trans_id')
                    ->label('Transaction ID')
                    ->disabled(),
                TextInput::make('status')
                    ->disabled(),
            ]);
    }
}
