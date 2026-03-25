<?php

namespace App\Filament\Widgets;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class SubscriptionStatsWidget extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 2;

    protected ?string $heading = 'Subscriptions';

    protected ?string $description = 'Subscription phase — orders that entered service activation';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        // Subscription-phase: orders that HAVE a subscription order ID.
        // Date filters apply on subscribed_at so stats reflect subscription window.
        $query = SurveyOrder::query()
            ->whereNotNull('customer_subscription_order_id')
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('subscribed_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('subscribed_at', '<=', $dateTo));

        $countsByStatus = (clone $query)->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');

        $total = $countsByStatus->sum();
        $waiting = (int) ($countsByStatus[FFDServiceProvisionStatus::Waiting->value] ?? 0);
        $completed = (int) ($countsByStatus[FFDServiceProvisionStatus::Completed->value] ?? 0);
        $processing = (int) ($countsByStatus[FFDServiceProvisionStatus::Processing->value] ?? 0);
        $failed = (int) ($countsByStatus[FFDServiceProvisionStatus::Failed->value] ?? 0);
        $cancelled = (int) ($countsByStatus[FFDServiceProvisionStatus::Cancelled->value] ?? 0);

        return [
            Stat::make('Total Subscribed', $total)
                ->description('Entered subscription'),
            Stat::make('Completed', $completed)
                ->description('Service activated')
                ->color('success'),
            Stat::make('Waiting', $waiting)
                ->description('Service Activation pending')
                ->color('warning'),
            Stat::make('Processing', $processing)
                ->description('Being provisioned')
                ->color('info'),
            Stat::make('Failed', $failed)
                ->description('Activation failed')
                ->color('danger'),
            Stat::make('Cancelled', $cancelled)
                ->description('Cancelled')
                ->color('gray'),
        ];
    }
}
