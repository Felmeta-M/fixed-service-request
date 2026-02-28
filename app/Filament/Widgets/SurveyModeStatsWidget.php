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

        // Single grouped query per mode to avoid N+1
        $manualCounts = (clone $manualQuery)->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');
        $autoCounts = (clone $autoQuery)->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');

        $manualTotal = $manualCounts->sum();
        $autoTotal = $autoCounts->sum();
        $manualCompleted = (int) ($manualCounts[FFDServiceProvisionStatus::Completed->value] ?? 0);
        $autoCompleted = (int) ($autoCounts[FFDServiceProvisionStatus::Completed->value] ?? 0);
        $manualWaiting = (int) ($manualCounts[FFDServiceProvisionStatus::Waiting->value] ?? 0);
        $autoWaiting = (int) ($autoCounts[FFDServiceProvisionStatus::Waiting->value] ?? 0);

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
