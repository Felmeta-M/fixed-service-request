<?php

namespace App\Filament\Resources\Payments\Pages;

use App\Filament\Resources\Payments\PaymentResource;
use App\Models\Payment;
use Filament\Resources\Pages\ListRecords;
use Filament\Schemas\Components\Tabs\Tab;
use Illuminate\Database\Eloquent\Builder;

class ListPayments extends ListRecords
{
    protected static string $resource = PaymentResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    /**
     * Tabs: Paid (default), All, Pending, Failed, Cancelled.
     * Badges use closures so each gets a fresh query (avoids clone/mutation issues).
     */
    public function getTabs(): array
    {
        $resource = static::getResource();

        return [
            'paid' => Tab::make('Paid')
                ->badge(fn () => $resource::getEloquentQuery()->paid()->whereNotNull('trans_id')->where('trans_id', '!=', '')->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->paid()->whereNotNull('trans_id')->where('trans_id', '!=', '')),

            'all' => Tab::make('All')
                ->badge(fn () => $resource::getEloquentQuery()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query),

            'pending' => Tab::make('Pending')
                ->badge(fn () => $resource::getEloquentQuery()->pending()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->pending()),

            'failed' => Tab::make('Failed')
                ->badge(fn () => $resource::getEloquentQuery()->where('status', Payment::STATUS_FAILED)->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Payment::STATUS_FAILED)),

            'cancelled' => Tab::make('Cancelled')
                ->badge(fn () => $resource::getEloquentQuery()->canceled()->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->canceled()),
        ];
    }

    public function getDefaultActiveTab(): string|int|null
    {
        return 'paid';
    }
}
