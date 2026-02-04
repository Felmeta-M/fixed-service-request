<?php

namespace App\Services;

use App\Services\Survey\Manual\ManualSurveyServiceFactory;
use Illuminate\Http\JsonResponse;

/**
 * Facade for manual survey order creation.
 *
 * @deprecated Use ManualSurveyServiceFactory and ManualDataSurveyService / ManualVoiceSurveyService directly.
 *   This class delegates to the factory based on main_offer_id for backward compatibility.
 */
class ManualSurveyOrderService
{
    public function __construct(
        protected ManualSurveyServiceFactory $manualSurveyServiceFactory
    ) {
    }

    /**
     * Create a manual survey order (delegates to Fixed Data or Fixed Voice manual service).
     */
    public function createSurveyOrder(array $data): JsonResponse
    {
        return $this->manualSurveyServiceFactory->make((int) ($data['main_offer_id'] ?? 0))->createSurveyOrder($data);
    }
}
