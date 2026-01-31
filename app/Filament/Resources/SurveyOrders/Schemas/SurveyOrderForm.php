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
            ->components([
                Section::make('Order Information')
                    ->description('Basic survey order details')
                    ->columns(3)
                    ->schema([
                        TextInput::make('customer_survey_order_id')
                            ->label('Survey Order ID')
                            ->required()
                            ->disabled(),
                        TextInput::make('customer_subscription_order_id')
                            ->label('Subscription Order ID')
                            ->disabled(),
                        Select::make('status')
                            ->label('Status')
                            ->options(FFDServiceProvisionStatus::options())
                            ->required(),
                        TextInput::make('survey_type')
                            ->label('Survey Type')
                            ->required(),
                        Toggle::make('survey_is_manual')
                            ->label('Manual Survey')
                            ->inline(false),
                        TextInput::make('telecom_region')
                            ->label('Telecom Region')
                            ->required(),
                    ]),

                Section::make('Customer Information')
                    ->columns(3)
                    ->schema([
                        TextInput::make('customer_code')
                            ->label('Customer Code')
                            ->required(),
                        TextInput::make('customer_type')
                            ->label('Customer Type')
                            ->required(),
                        TextInput::make('oper_type')
                            ->label('Operation Type')
                            ->required(),
                    ]),

                Section::make('Service Details')
                    ->columns(3)
                    ->schema([
                        TextInput::make('main_offer_id')
                            ->label('Offer ID')
                            ->required(),
                        TextInput::make('bandwidth')
                            ->label('Bandwidth'),
                        TextInput::make('service_number')
                            ->label('Service Number'),
                        TextInput::make('fbb_service_number')
                            ->label('FBB Service Number'),
                        TextInput::make('internet_account')
                            ->label('Internet Account'),
                        TextInput::make('internet_password')
                            ->label('Internet Password'),
                    ]),

                Section::make('Location')
                    ->columns(3)
                    ->schema([
                        TextInput::make('area_code')
                            ->label('Area Code'),
                        TextInput::make('area_name')
                            ->label('Area Name'),
                        TextInput::make('zone_code')
                            ->label('Zone Code'),
                        TextInput::make('lat')
                            ->label('Latitude')
                            ->numeric(),
                        TextInput::make('long')
                            ->label('Longitude')
                            ->numeric(),
                    ]),

                Section::make('Contact Information')
                    ->columns(2)
                    ->schema([
                        Fieldset::make('Primary Contact')
                            ->schema([
                                TextInput::make('contact_person')
                                    ->label('Name'),
                                TextInput::make('contact_no')
                                    ->label('Phone'),
                                TextInput::make('contact_email')
                                    ->label('Email')
                                    ->email(),
                            ])
                            ->columns(3),
                        Fieldset::make('Secondary Contact')
                            ->schema([
                                TextInput::make('sec_contact_person')
                                    ->label('Name'),
                                TextInput::make('sec_contact_no')
                                    ->label('Phone'),
                                TextInput::make('sec_contact_email')
                                    ->label('Email')
                                    ->email(),
                            ])
                            ->columns(3),
                    ]),

                Section::make('Cable & Infrastructure')
                    ->columns(3)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextInput::make('cable_length')
                            ->label('Cable Length')
                            ->numeric()
                            ->suffix('m'),
                        TextInput::make('cable_type')
                            ->label('Cable Type'),
                        TextInput::make('cable_charge')
                            ->label('Cable Charge')
                            ->numeric()
                            ->prefix('ETB'),
                        TextInput::make('media_type')
                            ->label('Media Type'),
                        TextInput::make('line_indicator')
                            ->label('Line Indicator')
                            ->numeric(),
                    ]),

                Section::make('Device Information')
                    ->columns(3)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        Toggle::make('with_device')
                            ->label('With Device')
                            ->inline(false),
                        TextInput::make('device_id')
                            ->label('Device ID'),
                        TextInput::make('device_voice_id')
                            ->label('Voice Device ID'),
                    ]),

                Section::make('Dates & Status')
                    ->columns(3)
                    ->schema([
                        DateTimePicker::make('completed_date')
                            ->label('Completed Date'),
                        DateTimePicker::make('subscribed_at')
                            ->label('Subscribed At'),
                        DateTimePicker::make('last_checked_at')
                            ->label('Last Checked')
                            ->disabled(),
                        TextInput::make('last_synced_status')
                            ->label('Last Synced Status')
                            ->disabled(),
                        Textarea::make('survey_failure_reason')
                            ->label('Failure Reason')
                            ->columnSpan(2),
                    ]),

                Section::make('Cancellation')
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        Textarea::make('cancel_reason')
                            ->label('Cancel Reason')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
