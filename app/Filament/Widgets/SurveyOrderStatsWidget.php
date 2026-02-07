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

    protected ?string $description = 'Overview of survey order statuses.';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        $query = SurveyOrder::query()
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('created_at', '<=', $dateTo));

        $total = (clone $query)->count();
        $waiting = (clone $query)->where('status', FFDServiceProvisionStatus::Waiting)->count();
        $completed = (clone $query)->where('status', FFDServiceProvisionStatus::Completed)->count();
        $failed = (clone $query)->where('status', FFDServiceProvisionStatus::Failed)->count();
        $processing = (clone $query)->where('status', FFDServiceProvisionStatus::Processing)->count();
        $cancelled = (clone $query)->where('status', FFDServiceProvisionStatus::Cancelled)->count();

        return [
            Stat::make('Total Orders', $total)
                ->description('All survey orders'),
            Stat::make('Waiting', $waiting)
                ->description('Waiting subscription')
                ->color('warning'),
            Stat::make('Completed', $completed)
                ->description('Successfully completed')
                ->color('success'),
            Stat::make('Processing', $processing)
                ->description('In progress')
                ->color('info'),
            Stat::make('Failed', $failed)
                ->description('Failed orders')
                ->color('danger'),
            Stat::make('Cancelled', $cancelled)
                ->description('Cancelled orders')
                ->color('gray'),
        ];
    }
}
