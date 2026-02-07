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

    protected ?string $description = 'Payment status and revenue overview';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        $query = Payment::query()
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('created_at', '<=', $dateTo));

        $total = (clone $query)->count();

        $paid = (clone $query)->where('status', Payment::STATUS_PAID)->count();

        $pending = (clone $query)->where('status', Payment::STATUS_PENDING)->count();

        $failed = (clone $query)->where('status', Payment::STATUS_FAILED)->count();

        $cancelled = (clone $query)->where('status', Payment::STATUS_CANCELLED)->count();

        $totalRevenue = (clone $query)
            ->where('status', Payment::STATUS_PAID)
            ->sum('total_amount');

        return [
            Stat::make('Total Payments', $total)
                ->description('All payment records'),
            Stat::make('Paid', $paid)
                ->description('Successful payments')
                ->color('success'),
            Stat::make('Pending', $pending)
                ->description('Awaiting payment')
                ->color('warning'),
            Stat::make('Failed', $failed)
                ->description('Payment failed')
                ->color('danger'),
            Stat::make('Cancelled', $cancelled)
                ->description('Cancelled')
                ->color('gray'),
            Stat::make('Revenue', number_format($totalRevenue, 2) . ' ETB')
                ->description('Total collected')
                ->color('success'),
        ];
    }
}
