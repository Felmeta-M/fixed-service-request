<?php

namespace App\Filament\Resources\SurveyOrders\Schemas;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SurveyOrderInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(3)
            ->components([
                Section::make('Order Information')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextEntry::make('customer_survey_order_id')
                            ->label('Survey Order ID')
                            ->copyable(),
                        TextEntry::make('customer_subscription_order_id')
                            ->label('Subscription Order ID')
                            ->placeholder('-')
                            ->copyable(),
                        TextEntry::make('status')
                            ->label('Status')
                            ->badge()
                            ->formatStateUsing(fn(int $state): string => FFDServiceProvisionStatus::tryFrom($state)?->label() ?? 'Unknown')
                            ->color(fn(int $state): string => match ($state) {
                                FFDServiceProvisionStatus::Completed->value => 'success',
                                FFDServiceProvisionStatus::Waiting->value,
                                FFDServiceProvisionStatus::Processing->value => 'warning',
                                FFDServiceProvisionStatus::Failed->value => 'danger',
                                FFDServiceProvisionStatus::Cancelled->value => 'gray',
                                default => 'primary',
                            }),
                        TextEntry::make('survey_type')
                            ->label('Survey Type'),
                        IconEntry::make('survey_is_manual')
                            ->label('Manual Survey')
                            ->boolean(),
                        TextEntry::make('telecom_region')
                            ->label('Telecom Region'),
                    ]),

                Section::make('Customer Information')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextEntry::make('customer_code')
                            ->label('Customer Code')
                            ->copyable(),
                        TextEntry::make('customer_type')
                            ->label('Customer Type'),
                        TextEntry::make('oper_type')
                            ->label('Operation Type'),
                    ]),

                Section::make('Service Details')
                    ->columnSpanFull()
                    ->columns(3)
                    ->schema([
                        TextEntry::make('main_offer_id')
                            ->label('Offer ID'),
                        TextEntry::make('bandwidth')
                            ->label('Bandwidth')
                            ->placeholder('-'),
                        TextEntry::make('voice_service_number')
                            ->label('Voice Service Number')
                            ->placeholder('-')
                            ->copyable(),
                        TextEntry::make('data_service_number')
                            ->label('Data/FBB Service Number')
                            ->placeholder('-'),
                        TextEntry::make('internet_account')
                            ->label('Internet Account')
                            ->placeholder('-'),
                        TextEntry::make('internet_password')
                            ->label('Internet Password')
                            ->placeholder('-'),
                    ]),

                Section::make('Location')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        TextEntry::make('area_code')
                            ->label('Area Code')
                            ->placeholder('-'),
                        TextEntry::make('area_name')
                            ->label('Area Name')
                            ->placeholder('-'),
                        TextEntry::make('zone_code')
                            ->label('Zone Code')
                            ->placeholder('-'),
                        TextEntry::make('lat')
                            ->label('Latitude')
                            ->numeric()
                            ->placeholder('-'),
                        TextEntry::make('long')
                            ->label('Longitude')
                            ->numeric()
                            ->placeholder('-'),
                    ]),

                Section::make('Contact Information')
                    ->columnSpanFull()
                    ->columns(2)
                    ->schema([
                        Fieldset::make('Primary Contact')
                            ->schema([
                                TextEntry::make('contact_person')
                                    ->label('Name')
                                    ->placeholder('-'),
                                TextEntry::make('contact_no')
                                    ->label('Phone')
                                    ->placeholder('-'),
                                TextEntry::make('contact_email')
                                    ->label('Email')
                                    ->placeholder('-'),
                            ])
                            ->columns(3),
                        Fieldset::make('Secondary Contact')
                            ->schema([
                                TextEntry::make('sec_contact_person')
                                    ->label('Name')
                                    ->placeholder('-'),
                                TextEntry::make('sec_contact_no')
                                    ->label('Phone')
                                    ->placeholder('-'),
                                TextEntry::make('sec_contact_email')
                                    ->label('Email')
                                    ->placeholder('-'),
                            ])
                            ->columns(3),
                    ]),

                Section::make('Cable & Infrastructure')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextEntry::make('cable_length')
                            ->label('Cable Length')
                            ->numeric()
                            ->suffix(' m')
                            ->placeholder('-'),
                        TextEntry::make('cable_type')
                            ->label('Cable Type')
                            ->placeholder('-'),
                        TextEntry::make('cable_charge')
                            ->label('Cable Charge')
                            ->numeric()
                            ->prefix('ETB ')
                            ->placeholder('-'),
                        TextEntry::make('media_type')
                            ->label('Media Type')
                            ->placeholder('-'),
                        TextEntry::make('line_indicator')
                            ->label('Line Indicator')
                            ->numeric()
                            ->placeholder('-'),
                    ]),

                Section::make('Device Information')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        IconEntry::make('with_device')
                            ->label('With Device')
                            ->boolean(),
                        TextEntry::make('device_id')
                            ->label('Device ID')
                            ->placeholder('-'),
                        TextEntry::make('device_voice_id')
                            ->label('Voice Device ID')
                            ->placeholder('-'),
                    ]),

                Section::make('Dates & Timestamps')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        TextEntry::make('completed_date')
                            ->label('Completed Date')
                            ->dateTime('M j, Y H:i')
                            ->placeholder('-'),
                        TextEntry::make('subscribed_at')
                            ->label('Subscribed At')
                            ->dateTime('M j, Y H:i')
                            ->placeholder('-'),
                        TextEntry::make('last_checked_at')
                            ->label('Last Checked')
                            ->dateTime('M j, Y H:i')
                            ->placeholder('-'),
                        TextEntry::make('created_at')
                            ->label('Created')
                            ->dateTime('M j, Y H:i'),
                        TextEntry::make('updated_at')
                            ->label('Updated')
                            ->dateTime('M j, Y H:i'),
                        TextEntry::make('deleted_at')
                            ->label('Deleted')
                            ->dateTime('M j, Y H:i')
                            ->visible(fn(SurveyOrder $record): bool => $record->trashed()),
                    ]),

                Section::make('Status & Issues')
                    ->columnSpanFull()
                    ->columns(2)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextEntry::make('last_synced_status')
                            ->label('Last Synced Status')
                            ->placeholder('-'),
                        TextEntry::make('survey_failure_reason')
                            ->label('Failure Reason')
                            ->placeholder('-'),
                        TextEntry::make('cancel_reason')
                            ->label('Cancel Reason')
                            ->placeholder('-')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
