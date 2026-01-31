<?php

namespace App\Filament\Resources\SurveyOrders\Pages;

use App\Filament\Resources\SurveyOrders\SurveyOrderResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSurveyOrders extends ListRecords
{
    protected static string $resource = SurveyOrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
