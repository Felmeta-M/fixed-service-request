<?php

namespace App\Filament\Resources\SurveyOrders\Schemas;

use App\Enums\FFDServiceProvisionStatus;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SurveyOrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(3)
            ->components([
                Section::make('Order Information')
                    ->description('Basic survey order details')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextInput::make('customer_survey_order_id')
                            ->label('Survey Order ID')
                            ->disabled(),
                        TextInput::make('customer_subscription_order_id')
                            ->label('Subscription Order ID')
                            ->disabled(),
                        Select::make('status')
                            ->label('Status')
                            ->options(FFDServiceProvisionStatus::options())
                            ->disabled(),
                        TextInput::make('survey_type')
                            ->label('Survey Type')
                            ->disabled(),
                        Toggle::make('survey_is_manual')
                            ->label('Manual Survey')
                            ->inline(false)
                            ->disabled(),
                        TextInput::make('telecom_region')
                            ->label('Telecom Region')
                            ->disabled(),
                    ]),

                Section::make('Customer Information')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextInput::make('customer_code')
                            ->label('Customer Code')
                            ->disabled(),
                        TextInput::make('customer_type')
                            ->label('Customer Type')
                            ->disabled(),
                        TextInput::make('oper_type')
                            ->label('Operation Type')
                            ->disabled(),
                    ]),

                Section::make('Service Details')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextInput::make('main_offer_id')
                            ->label('Offer ID')
                            ->disabled(),
                        TextInput::make('bandwidth')
                            ->label('Bandwidth')
                            ->disabled(),
                        TextInput::make('voice_service_number')
                            ->label('Voice Service Number')
                            ->disabled(),
                        TextInput::make('data_service_number')
                            ->label('Data/FBB Service Number')
                            ->disabled(),
                        TextInput::make('internet_account')
                            ->label('Internet Account')
                            ->disabled(),
                        TextInput::make('internet_password')
                            ->label('Internet Password')
                            ->disabled(),
                    ]),

                Section::make('Location')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextInput::make('area_code')
                            ->label('Area Code')
                            ->disabled(),
                        TextInput::make('area_name')
                            ->label('Area Name')
                            ->disabled(),
                        TextInput::make('zone_code')
                            ->label('Zone Code')
                            ->disabled(),
                        TextInput::make('lat')
                            ->label('Latitude')
                            ->numeric()
                            ->disabled(),
                        TextInput::make('long')
                            ->label('Longitude')
                            ->numeric()
                            ->disabled(),
                    ]),

                Section::make('Contact Information')
                    ->columnSpanFull()
                    ->columns(2)
                    ->schema([
                        Fieldset::make('Primary Contact')
                            ->schema([
                                TextInput::make('contact_person')
                                    ->label('Name')
                                    ->disabled(),
                                TextInput::make('contact_no')
                                    ->label('Phone')
                                    ->disabled(),
                                TextInput::make('contact_email')
                                    ->label('Email')
                                    ->disabled(),
                            ])
                            ->columns(3),
                        Fieldset::make('Secondary Contact')
                            ->schema([
                                TextInput::make('sec_contact_person')
                                    ->label('Name')
                                    ->disabled(),
                                TextInput::make('sec_contact_no')
                                    ->label('Phone')
                                    ->disabled(),
                                TextInput::make('sec_contact_email')
                                    ->label('Email')
                                    ->disabled(),
                            ])
                            ->columns(3),
                    ]),

                Section::make('Cable & Infrastructure')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextInput::make('cable_length')
                            ->label('Cable Length')
                            ->numeric()
                            ->suffix('m')
                            ->disabled(),
                        TextInput::make('cable_type')
                            ->label('Cable Type')
                            ->disabled(),
                        TextInput::make('cable_charge')
                            ->label('Cable Charge')
                            ->numeric()
                            ->prefix('ETB')
                            ->disabled(),
                        TextInput::make('media_type')
                            ->label('Media Type')
                            ->disabled(),
                        TextInput::make('line_indicator')
                            ->label('Line Indicator')
                            ->numeric()
                            ->disabled(),
                    ]),

                Section::make('Device Information')
                    ->columnSpanFull()
                    ->columns(4)
                    ->collapsible()
                    ->schema([
                        Toggle::make('with_device')
                            ->label('With Device')
                            ->inline(false)
                            ->disabled(),
                        TextInput::make('device.item_code')
                            ->label('Fixed Broadband Item Code')
                            ->disabled(),
                        TextInput::make('voiceDevice.item_code')
                            ->label('Fix  Voice Item Code')
                            ->disabled(),
                        TextInput::make('device_offer_id')
                            ->label('Fixed Broadband Offer')
                            ->disabled(),

                    ]),

                Section::make('Dates & Status')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        DateTimePicker::make('completed_date')
                            ->label('Completed Date')
                            ->disabled(),
                        DateTimePicker::make('subscribed_at')
                            ->label('Subscribed At')
                            ->disabled(),
                        DateTimePicker::make('last_checked_at')
                            ->label('Last Checked')
                            ->disabled(),
                        TextInput::make('last_synced_status')
                            ->label('Last Synced Status')
                            ->disabled(),
                        Textarea::make('survey_failure_reason')
                            ->label('Failure Reason')
                            ->columnSpan(2)
                            ->disabled(),
                    ]),

                Section::make('Cancellation')
                    ->columnSpanFull()
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        Textarea::make('cancel_reason')
                            ->label('Cancel Reason')
                            ->columnSpanFull()
                            ->disabled(),
                    ]),
            ]);
    }
}
