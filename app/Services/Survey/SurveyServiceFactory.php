<?php

namespace App\Services\Survey;

use App\Enums\OfferId;
use InvalidArgumentException;

class SurveyServiceFactory
{
    public function make(int $offerId): SurveyInterface
    {
        return match ($offerId) {
            OfferId::FixedData->value  => app(DataSurveyService::class),
            OfferId::FixedVoice->value => app(VoiceSurveyService::class),
            OfferId::FixedCombo->value => app(ComboSurveyService::class),
            default => throw new InvalidArgumentException("Unsupported survey offer"),
        };
    }
}
