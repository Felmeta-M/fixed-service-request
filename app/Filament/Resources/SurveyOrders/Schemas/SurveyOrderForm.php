<?php

namespace App\Filament\Resources\SurveyOrders\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class SurveyOrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('customer_id')
                    ->numeric(),
                TextInput::make('customer_code')
                    ->required(),
                TextInput::make('customer_survey_order_id')
                    ->required(),
                TextInput::make('main_offer_id')
                    ->required(),
                TextInput::make('service_number'),
                TextInput::make('survey_type')
                    ->required(),
                TextInput::make('telecom_region')
                    ->tel()
                    ->required(),
                TextInput::make('oper_type')
                    ->required(),
                TextInput::make('customer_type')
                    ->required(),
                TextInput::make('bandwidth'),
                TextInput::make('contact_person'),
                TextInput::make('contact_no'),
                TextInput::make('contact_email')
                    ->email(),
                TextInput::make('sec_contact_person'),
                TextInput::make('sec_contact_no'),
                TextInput::make('sec_contact_email')
                    ->email(),
                TextInput::make('status'),
                Textarea::make('cancel_reason')
                    ->columnSpanFull(),
                DateTimePicker::make('completed_date'),
                DateTimePicker::make('subscribed_at'),
                Toggle::make('survey_is_manual')
                    ->required(),
                TextInput::make('cable_length')
                    ->numeric(),
                TextInput::make('cable_type'),
                TextInput::make('cable_charge')
                    ->numeric(),
                TextInput::make('lat')
                    ->numeric(),
                TextInput::make('long')
                    ->numeric(),
                Toggle::make('with_device'),
                TextInput::make('device_id'),
                TextInput::make('device_voice_id'),
                TextInput::make('last_synced_status'),
                DateTimePicker::make('last_checked_at'),
                TextInput::make('customer_subscription_order_id'),
                TextInput::make('fbb_service_number'),
                TextInput::make('area_code'),
                TextInput::make('area_name'),
                TextInput::make('internet_account'),
                TextInput::make('internet_password')
                    ->password(),
                TextInput::make('media_type'),
                TextInput::make('line_indicator')
                    ->numeric()
                    ->default(0),
                TextInput::make('survey_failure_reason'),
                TextInput::make('zone_code'),
            ]);
    }
}
