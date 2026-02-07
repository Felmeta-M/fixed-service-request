<?php

namespace App\Filament\Widgets;

use App\Enums\FFDServiceProvisionStatus;
use App\Enums\OfferId;
use App\Models\SurveyOrder;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class ServiceTypeStatsWidget extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 4;

    protected ?string $heading = 'By Service Type';

    protected ?string $description = 'Order breakdown by Data, Voice, and Combo';

    protected ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $dateFrom = $this->pageFilters['date_from'] ?? null;
        $dateTo = $this->pageFilters['date_to'] ?? null;

        $query = SurveyOrder::query()
            ->when($dateFrom, fn (Builder $q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn (Builder $q) => $q->whereDate('created_at', '<=', $dateTo));

        $totalOrders = (clone $query)->count();

        // By service type (offer)
        $dataOrders = (clone $query)->where('main_offer_id', OfferId::FixedData->value)->count();
        $voiceOrders = (clone $query)->where('main_offer_id', OfferId::FixedVoice->value)->count();
        $comboOrders = (clone $query)->where('main_offer_id', OfferId::FixedCombo->value)->count();

        // Completed by service type
        $dataCompleted = (clone $query)
            ->where('main_offer_id', OfferId::FixedData->value)
            ->where('status', FFDServiceProvisionStatus::Completed)
            ->count();

        $voiceCompleted = (clone $query)
            ->where('main_offer_id', OfferId::FixedVoice->value)
            ->where('status', FFDServiceProvisionStatus::Completed)
            ->count();

        $comboCompleted = (clone $query)
            ->where('main_offer_id', OfferId::FixedCombo->value)
            ->where('status', FFDServiceProvisionStatus::Completed)
            ->count();

        return [
            Stat::make('Total Orders', $totalOrders)
                ->description('All service types'),
            Stat::make('Data', $dataOrders)
                ->description($dataCompleted . ' completed')
                ->color('info'),
            Stat::make('Voice', $voiceOrders)
                ->description($voiceCompleted . ' completed')
                ->color('warning'),
            Stat::make('Combo', $comboOrders)
                ->description($comboCompleted . ' completed')
                ->color('success'),
        ];
    }
}
