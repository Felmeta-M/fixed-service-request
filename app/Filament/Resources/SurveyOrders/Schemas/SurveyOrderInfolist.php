<?php

namespace App\Filament\Resources\SurveyOrders\Schemas;

use App\Models\SurveyOrder;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class SurveyOrderInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('customer_id')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('customer_code'),
                TextEntry::make('customer_survey_order_id'),
                TextEntry::make('main_offer_id'),
                TextEntry::make('service_number')
                    ->placeholder('-'),
                TextEntry::make('survey_type'),
                TextEntry::make('telecom_region'),
                TextEntry::make('oper_type'),
                TextEntry::make('customer_type'),
                TextEntry::make('bandwidth')
                    ->placeholder('-'),
                TextEntry::make('contact_person')
                    ->placeholder('-'),
                TextEntry::make('contact_no')
                    ->placeholder('-'),
                TextEntry::make('contact_email')
                    ->placeholder('-'),
                TextEntry::make('sec_contact_person')
                    ->placeholder('-'),
                TextEntry::make('sec_contact_no')
                    ->placeholder('-'),
                TextEntry::make('sec_contact_email')
                    ->placeholder('-'),
                TextEntry::make('status')
                    ->placeholder('-'),
                TextEntry::make('cancel_reason')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('completed_date')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('subscribed_at')
                    ->dateTime()
                    ->placeholder('-'),
                IconEntry::make('survey_is_manual')
                    ->boolean(),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('deleted_at')
                    ->dateTime()
                    ->visible(fn (SurveyOrder $record): bool => $record->trashed()),
                TextEntry::make('cable_length')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('cable_type')
                    ->placeholder('-'),
                TextEntry::make('cable_charge')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('lat')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('long')
                    ->numeric()
                    ->placeholder('-'),
                IconEntry::make('with_device')
                    ->boolean()
                    ->placeholder('-'),
                TextEntry::make('device_id')
                    ->placeholder('-'),
                TextEntry::make('device_voice_id')
                    ->placeholder('-'),
                TextEntry::make('last_synced_status')
                    ->placeholder('-'),
                TextEntry::make('last_checked_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('customer_subscription_order_id')
                    ->placeholder('-'),
                TextEntry::make('fbb_service_number')
                    ->placeholder('-'),
                TextEntry::make('area_code')
                    ->placeholder('-'),
                TextEntry::make('area_name')
                    ->placeholder('-'),
                TextEntry::make('internet_account')
                    ->placeholder('-'),
                TextEntry::make('media_type')
                    ->placeholder('-'),
                TextEntry::make('line_indicator')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('survey_failure_reason')
                    ->placeholder('-'),
                TextEntry::make('zone_code')
                    ->placeholder('-'),
            ]);
    }
}
