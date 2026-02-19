<?php

namespace App\Filament\Resources\Payments\Exports;

use App\Models\Payment;
use Filament\Actions\Exports\ExportColumn;
use Filament\Actions\Exports\Exporter;
use Filament\Actions\Exports\Models\Export;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Number;

class PaymentExporter extends Exporter
{
    protected static ?string $model = Payment::class;

    public static function getColumns(): array
    {
        return [
            ExportColumn::make('id')
                ->label('ID'),
            ExportColumn::make('customer_code')
                ->label('Customer Code'),
            ExportColumn::make('survey_request.contact_person')
                ->label('Contact Person'),
            ExportColumn::make('survey_request.contact_no')
                ->label('Contact No.'),
            ExportColumn::make('survey_request.contact_email')
                ->label('Contact Email'),
            ExportColumn::make('customer_survey_order_id')
                ->label('Survey Order ID'),
            ExportColumn::make('customer_subscription_order_id')
                ->label('Subscription Order ID'),
            ExportColumn::make('total_amount')
                ->label('Amount'),
            ExportColumn::make('trans_id')
                ->label('Transaction ID'),
            ExportColumn::make('status')
                ->label('Status')
                ->formatStateUsing(function (mixed $state): string {
                    $status = (int) $state;
                    return match ($status) {
                        Payment::STATUS_PAID => 'Paid',
                        Payment::STATUS_PENDING => 'Pending',
                        Payment::STATUS_FAILED => 'Failed',
                        Payment::STATUS_CANCELLED => 'Cancelled',
                        default => 'Unknown',
                    };
                }),
            ExportColumn::make('service_number')
                ->label('Service Number'),
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
        return $query->with('survey_request');
    }
}
