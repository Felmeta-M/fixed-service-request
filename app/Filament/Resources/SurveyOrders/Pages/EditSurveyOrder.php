<?php

namespace App\Filament\Resources\SurveyOrders\Pages;

use App\Filament\Resources\SurveyOrders\SurveyOrderResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditSurveyOrder extends EditRecord
{
    protected static string $resource = SurveyOrderResource::class;

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $record = $this->record;
        $data['device'] = [
            'name' => $record->device?->name,
            'item_code' => $record->device?->item_code,
            'offer_id' => $record->device?->offer_id,
        ];
        $data['voiceDevice'] = [
            'name' => $record->voiceDevice?->name,
            'item_code' => $record->voiceDevice?->item_code,
            'offer_id' => $record->voiceDevice?->offer_id,
        ];

        return $data;
    }

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            // DeleteAction::make(),
            // ForceDeleteAction::make(),
            // RestoreAction::make(),
        ];
    }
}
