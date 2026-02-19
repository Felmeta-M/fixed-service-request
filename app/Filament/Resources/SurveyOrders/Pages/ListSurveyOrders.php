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
        return [];
    }

    /**
     * Tabs filter by display status (same logic as SurveyOrderController::getStatusLabel).
     * No badges for performance. Each tab's modifyQueryUsing is applied when active so the table fetches filtered data.
     */
    public function getTabs(): array
    {
        return [
            'all' => Tab::make('All')
                ->modifyQueryUsing(fn(Builder $query) => $query),

            'survey_completed' => Tab::make('Survey Completed')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusSurveyCompleted()),

            'device_selection' => Tab::make('Device Selection')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusDeviceSelection()),

            'waiting' => Tab::make('Waiting')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusWaiting()),

            'ready' => Tab::make('Ready')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusReady()),

            'order_waiting' => Tab::make('Order Waiting')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusOrderWaiting()),

            'order_completed' => Tab::make('Order Completed')
                ->modifyQueryUsing(fn (Builder $query) => $query->displayStatusOrderCompleted()),

            'failed' => Tab::make('Failed')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusFailed()),

            'cancelled' => Tab::make('Cancelled')
                ->modifyQueryUsing(fn(Builder $query) => $query->displayStatusCancelled()),
        ];
    }

    public function getDefaultActiveTab(): string|int|null
    {
        return 'all';
    }
}
