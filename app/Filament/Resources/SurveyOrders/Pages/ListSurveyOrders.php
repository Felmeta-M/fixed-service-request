<?php

namespace App\Filament\Resources\SurveyOrders\Pages;

use App\Enums\FFDServiceProvisionStatus;
use App\Filament\Resources\SurveyOrders\SurveyOrderResource;
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
     * Tabs match dashboard stats exactly (SurveyOrderStatsWidget + SubscriptionStatsWidget).
     * Survey phase = no subscription; Subscription phase = has subscription.
     */
    public function getTabs(): array
    {
        return [
            'all' => Tab::make('All')
                ->modifyQueryUsing(fn (Builder $query) => $query),

            // Survey phase (whereNull customer_subscription_order_id) — SurveyOrderStatsWidget
            'created' => Tab::make('Created')
                ->modifyQueryUsing(fn (Builder $query) => $query->withoutSubscription()->where('status', FFDServiceProvisionStatus::Created->value)),

            'survey_processing' => Tab::make('Survey Processing')
                ->modifyQueryUsing(fn (Builder $query) => $query->withoutSubscription()->where('status', FFDServiceProvisionStatus::Processing->value)),

            'survey_completed' => Tab::make('Survey Completed')
                ->modifyQueryUsing(fn (Builder $query) => $query->withoutSubscription()->where('status', FFDServiceProvisionStatus::Completed->value)),

            'survey_waiting' => Tab::make('Survey Waiting')
                ->modifyQueryUsing(fn (Builder $query) => $query->withoutSubscription()->where('status', FFDServiceProvisionStatus::Waiting->value)),

            'survey_failed' => Tab::make('Survey Failed')
                ->modifyQueryUsing(fn (Builder $query) => $query->withoutSubscription()->where('status', FFDServiceProvisionStatus::Failed->value)),

            'survey_cancelled' => Tab::make('Survey Cancelled')
                ->modifyQueryUsing(fn (Builder $query) => $query->withoutSubscription()->where('status', FFDServiceProvisionStatus::Cancelled->value)),

            // Subscription phase (whereNotNull customer_subscription_order_id) — SubscriptionStatsWidget
            'subscription_completed' => Tab::make('Subscription Completed')
                ->modifyQueryUsing(fn (Builder $query) => $query->withSubscription()->where('status', FFDServiceProvisionStatus::Completed->value)),

            'subscription_waiting' => Tab::make('Subscription Waiting')
                ->modifyQueryUsing(fn (Builder $query) => $query->withSubscription()->where('status', FFDServiceProvisionStatus::Waiting->value)),

            'subscription_processing' => Tab::make('Subscription Processing')
                ->modifyQueryUsing(fn (Builder $query) => $query->withSubscription()->where('status', FFDServiceProvisionStatus::Processing->value)),

            'subscription_failed' => Tab::make('Subscription Failed')
                ->modifyQueryUsing(fn (Builder $query) => $query->withSubscription()->where('status', FFDServiceProvisionStatus::Failed->value)),

            'subscription_cancelled' => Tab::make('Subscription Cancelled')
                ->modifyQueryUsing(fn (Builder $query) => $query->withSubscription()->where('status', FFDServiceProvisionStatus::Cancelled->value)),
        ];
    }

    public function getDefaultActiveTab(): string|int|null
    {
        return 'all';
    }
}
