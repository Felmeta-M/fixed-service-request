<?php

namespace App\Filament\Widgets;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class SurveyModeStatsWidget extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 5;

    protected ?string $heading = 'Manual vs Auto';

    protected ?string $description = 'Survey orders by creation mode';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        $baseQuery = SurveyOrder::query()
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('created_at', '<=', $dateTo));

        $manualQuery = (clone $baseQuery)->where('survey_is_manual', true);
        $autoQuery = (clone $baseQuery)->where(function (Builder $q) {
            $q->where('survey_is_manual', false)->orWhereNull('survey_is_manual');
        });

        $manualTotal = (clone $manualQuery)->count();
        $autoTotal = (clone $autoQuery)->count();

        $manualCompleted = (clone $manualQuery)->where('status', FFDServiceProvisionStatus::Completed)->count();
        $autoCompleted = (clone $autoQuery)->where('status', FFDServiceProvisionStatus::Completed)->count();

        $manualWaiting = (clone $manualQuery)->where('status', FFDServiceProvisionStatus::Waiting)->count();
        $autoWaiting = (clone $autoQuery)->where('status', FFDServiceProvisionStatus::Waiting)->count();

        return [
            Stat::make('Manual', $manualTotal)
                ->description($manualCompleted . ' completed, ' . $manualWaiting . ' waiting')
                ->color('warning'),
            Stat::make('Auto', $autoTotal)
                ->description($autoCompleted . ' completed, ' . $autoWaiting . ' waiting')
                ->color('info'),
        ];
    }
}
