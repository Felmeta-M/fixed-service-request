<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\CancelSurveyOrderService;
use Illuminate\Http\Request;

class CancelSurveyOrderController extends Controller
{

    public function __construct(protected readonly CancelSurveyOrderService $cancelSurveyOrderService) {}

    /**
     * Cancel a survey order.
     */
    public function cancel(Request $request)
    {
        $request->validate([
            'customer_survey_order_id' => 'required|string',
            'cancel_reason' => 'required|string'
        ]);

        $customerSurveyOrderId = $request->only(['customer_survey_order_id', 'cancel_reason']);

        return $this->cancelSurveyOrderService->cancelSurveyOrder($customerSurveyOrderId);
    }
}
