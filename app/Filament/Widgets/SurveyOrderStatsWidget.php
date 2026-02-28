<?php

namespace App\Filament\Widgets;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class SurveyOrderStatsWidget extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 1;

    protected ?string $heading = 'Survey Orders';

    protected ?string $description = 'Survey phase — orders awaiting survey completion';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        // Survey-phase: orders that have NOT yet entered subscription (single query to avoid N+1)
        $query = SurveyOrder::query()
            ->whereNull('customer_subscription_order_id')
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('created_at', '<=', $dateTo));

        $countsByStatus = (clone $query)->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');

        $total = $countsByStatus->sum();
        $created = (int) ($countsByStatus[FFDServiceProvisionStatus::Created->value] ?? 0);
        $processing = (int) ($countsByStatus[FFDServiceProvisionStatus::Processing->value] ?? 0);
        $surveyCompleted = (int) ($countsByStatus[FFDServiceProvisionStatus::Completed->value] ?? 0);
        $waiting = (int) ($countsByStatus[FFDServiceProvisionStatus::Waiting->value] ?? 0);
        $failed = (int) ($countsByStatus[FFDServiceProvisionStatus::Failed->value] ?? 0);
        $cancelled = (int) ($countsByStatus[FFDServiceProvisionStatus::Cancelled->value] ?? 0);

        return [
            Stat::make('Total Surveys', $total)
                ->description('Pre-subscription phase'),
            Stat::make('Created', $created)
                ->description('Newly created')
                ->color('gray'),
            Stat::make('Processing', $processing)
                ->description('Survey in progress')
                ->color('info'),
            Stat::make('Survey Completed', $surveyCompleted)
                ->description('Awaiting payment / subscription')
                ->color('success'),
            Stat::make('Waiting', $waiting)
                ->description('Waiting survey result')
                ->color('warning'),
            Stat::make('Failed', $failed)
                ->description('Survey failed')
                ->color('danger'),
            Stat::make('Cancelled', $cancelled)
                ->description('Cancelled')
                ->color('gray'),
        ];
    }
}
