<?php

namespace App\Filament\Widgets;

use App\Models\Payment;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class PaymentStatsWidget extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 3;

    protected ?string $heading = 'Payments';

    protected ?string $description = 'Payment status and revenue (excludes soft-deleted)';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        $createdAtQuery = Payment::query()
            ->whereNull('deleted_at')
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('created_at', '<=', $dateTo));

        $webhookNotifiedQuery = Payment::query()
            ->whereNull('deleted_at')
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('webhook_notified_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('webhook_notified_at', '<=', $dateTo));

        $total = (clone $createdAtQuery)->count();
        $paid = (clone $webhookNotifiedQuery)->where('status', Payment::STATUS_PAID)->whereNotNull('trans_id')->count();
        $pending = (clone $createdAtQuery)->where('status', Payment::STATUS_PENDING)->count();
        $failed = (clone $createdAtQuery)->where('status', Payment::STATUS_FAILED)->count();
        $cancelled = (clone $createdAtQuery)->where('status', Payment::STATUS_CANCELLED)->count();
        $totalRevenue = (clone $webhookNotifiedQuery)->where('status', Payment::STATUS_PAID)->whereNotNull('trans_id')->sum('total_amount');


        $successRate = $total > 0 ? round(($paid / $total) * 100, 1) : 0;

        return [
            Stat::make('Total attempts', number_format($total))
                ->description('By created date')
                ->icon('heroicon-o-credit-card')
                ->color('gray'),
            Stat::make('Paid', number_format($paid))
                ->description($total > 0 ? "{$successRate}% success rate" : 'Successful payments')
                ->icon('heroicon-o-check-circle')
                ->color('success'),
            Stat::make('Pending', number_format($pending))
                ->description('Awaiting payment')
                ->icon('heroicon-o-clock')
                ->color('warning'),
            Stat::make('Failed', number_format($failed))
                ->description('Payment failed')
                ->icon('heroicon-o-x-circle')
                ->color('danger'),
            Stat::make('Cancelled', number_format($cancelled))
                ->description('Cancelled by user or system')
                ->icon('heroicon-o-no-symbol')
                ->color('gray'),
            Stat::make('Revenue', number_format($totalRevenue, 2) . ' ETB')
                ->description($paid > 0 ? number_format($paid) . ' successful transactions' : 'Total collected')
                ->icon('heroicon-o-banknotes')
                ->color('success'),
        ];
    }
}
