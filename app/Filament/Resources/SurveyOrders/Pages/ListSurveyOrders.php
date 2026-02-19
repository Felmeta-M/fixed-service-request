<?php

namespace App\Filament\Resources\SurveyOrders\Pages;

use App\Filament\Resources\SurveyOrders\SurveyOrderResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
use Filament\Schemas\Components\Tabs\Tab;
use Illuminate\Database\Eloquent\Builder;

class ListSurveyOrders extends ListRecords
{
    protected static string $resource = SurveyOrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }

    /**
     * Tabs filter by display status (same logic as SurveyOrderController::getStatusLabel).
     * Scopes are defined on SurveyOrder model.
     */
    public function getTabs(): array
    {
        $base = static::getResource()::getEloquentQuery();

        return [
            'all' => Tab::make('All')
                ->badge($base->count())
                ->modifyQueryUsing(fn (Builder $query) => $query),

            'waiting' => Tab::make('Waiting')
                ->badge((clone $base)->displayStatusWaiting()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusWaiting()),

            'waiting_survey' => Tab::make('Waiting Survey')
                ->badge((clone $base)->displayStatusWaitingSurvey()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusWaitingSurvey()),

            'device_selection' => Tab::make('Device Selection')
                ->badge((clone $base)->displayStatusDeviceSelection()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusDeviceSelection()),

            'survey_completed' => Tab::make('Survey Completed')
                ->badge((clone $base)->displayStatusSurveyCompleted()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusSurveyCompleted()),

            'pending_payment' => Tab::make('Pending Payment')
                ->badge((clone $base)->displayStatusPendingPayment()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusPendingPayment()),

            'paid' => Tab::make('Paid')
                ->badge((clone $base)->displayStatusPaid()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusPaid()),

            'ready' => Tab::make('Ready')
                ->badge((clone $base)->displayStatusReady()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusReady()),

            'order_waiting' => Tab::make('Order Waiting')
                ->badge((clone $base)->displayStatusOrderWaiting()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusOrderWaiting()),

            'order_completed' => Tab::make('Order Completed')
                ->badge((clone $base)->displayStatusOrderCompleted()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusOrderCompleted()),

            'failed' => Tab::make('Failed')
                ->badge((clone $base)->displayStatusFailed()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusFailed()),

            'cancelled' => Tab::make('Cancelled')
                ->badge((clone $base)->displayStatusCancelled()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusCancelled()),
        ];
    }
}
