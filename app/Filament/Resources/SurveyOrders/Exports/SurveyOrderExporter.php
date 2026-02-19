<?php

namespace App\Filament\Resources\SurveyOrders\Exports;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Filament\Actions\Exports\ExportColumn;
use Filament\Actions\Exports\Exporter;
use Filament\Actions\Exports\Models\Export;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Number;

class SurveyOrderExporter extends Exporter
{
    protected static ?string $model = SurveyOrder::class;

    public static function getColumns(): array
    {
        return [
            ExportColumn::make('customer_survey_order_id')
                ->label('Order ID'),
            ExportColumn::make('customer_code')
                ->label('Customer'),
            ExportColumn::make('voice_service_number')
                ->label('Voice No.'),
            ExportColumn::make('data_service_number')
                ->label('Data No.'),
            ExportColumn::make('status')
                ->label('Status')
                ->formatStateUsing(fn (mixed $state): string => FFDServiceProvisionStatus::tryFrom((int) $state)?->label() ?? 'Unknown'),
            ExportColumn::make('bandwidth')
                ->label('Bandwidth'),
            ExportColumn::make('telecom_region')
                ->label('Region'),
            ExportColumn::make('survey_is_manual')
                ->label('Manual')
                ->formatStateUsing(fn (mixed $state): string => $state ? 'Yes' : 'No'),
            ExportColumn::make('with_device')
                ->label('With Device')
                ->formatStateUsing(fn (mixed $state): string => $state ? 'Yes' : 'No'),
            ExportColumn::make('contact_person')
                ->label('Contact'),
            ExportColumn::make('contact_no')
                ->label('Phone'),
            ExportColumn::make('completed_date')
                ->label('Completed'),
            ExportColumn::make('created_at')
                ->label('Created'),
            ExportColumn::make('updated_at')
                ->label('Updated'),
        ];
    }

    public static function getCompletedNotificationBody(Export $export): string
    {
        $body = __('filament-actions::export.notifications.completed.body', [
            'formatted' => Number::format($export->successful_rows),
            'failed' => Number::format($export->getFailedRowsCount()),
        ]);

        if ($export->getFailedRowsCount() > 0) {
            $body .= ' ' . __('filament-actions::export.notifications.completed.failed_rows');
        }

        return $body;
    }

    public static function modifyQuery(Builder $query): Builder
    {
        return $query;
    }
}
