<?php

namespace App\Services\Survey\Manual;

use App\Enums\OfferId;
use InvalidArgumentException;

/**
 * Factory for manual survey services (Fixed Data, Fixed Voice, Fixed Combo).
 *
 * Use when survey_is_manual is true; returns the appropriate manual
 * survey service based on main_offer_id. Each type has its own XML build and parse.
 */
class ManualSurveyServiceFactory
{
    public function make(int $mainOfferId): BaseManualSurveyService
    {
        return match ($mainOfferId) {
            OfferId::FixedData->value => app(ManualDataSurveyService::class),
            OfferId::FixedVoice->value => app(ManualVoiceSurveyService::class),
            OfferId::FixedCombo->value => app(ManualComboSurveyService::class),
            default => throw new InvalidArgumentException(
                "Unsupported manual survey offer: {$mainOfferId}. Only Fixed Data, Fixed Voice, and Fixed Combo are supported."
            ),
        };
    }
}
