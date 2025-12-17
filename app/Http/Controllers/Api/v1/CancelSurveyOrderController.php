<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\CancelDataSurveyOrderService;
use Illuminate\Http\Request;

class CancelSurveyOrderController extends Controller
{

    public function __construct(protected readonly CancelDataSurveyOrderService $cancelDataSurveyOrderService) {}

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

        return $this->cancelDataSurveyOrderService->cancelSurveyOrder($customerSurveyOrderId);
    }
}
