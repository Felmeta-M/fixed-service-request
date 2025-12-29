<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\CancelSurveyOrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        $validated = $request->only(['customer_survey_order_id', 'cancel_reason']);
        Log::info($validated);
        return $this->cancelSurveyOrderService->cancelSurveyOrder($validated);
    }
}
