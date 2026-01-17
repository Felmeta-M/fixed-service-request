<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\SurveyOrder;
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

        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $request->customer_survey_order_id)
            ->first();

        if (!$surveyOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Survey order not found.',
            ], 404);
        }

        if (!$surveyOrder->canCancel()) {
            return response()->json([
                'success' => false,
                'message' => 'This order cannot be cancelled in its current state.',
            ], 422);
        }

        $data = $request->only(['customer_survey_order_id', 'cancel_reason']);

        return $this->cancelSurveyOrderService->cancelSurveyOrder($data);
    }
}
