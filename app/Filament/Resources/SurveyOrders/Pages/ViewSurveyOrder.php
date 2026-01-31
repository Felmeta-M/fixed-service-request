<?php

namespace App\Filament\Resources\SurveyOrders\Pages;

use App\Filament\Resources\SurveyOrders\SurveyOrderResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewSurveyOrder extends ViewRecord
{
    protected static string $resource = SurveyOrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
