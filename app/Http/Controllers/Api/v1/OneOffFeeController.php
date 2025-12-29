<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\SurveyOrderResource;
use App\Models\SurveyOrder;
use App\Services\Payment\OneOffFeeService;
use App\Services\Payment\PaymentService;
use App\Traits\CableChargeTrait;
use Illuminate\Http\Request;

class OneOffFeeController extends Controller
{
    use CableChargeTrait;

    public function __construct(
        protected readonly OneOffFeeService $oneOffFeeService,
        protected readonly PaymentService $payment_service,
    ) {}

    public function calculateOneOffFee(Request $request)
    {

        $validated = $request->validate([
            'customer_survey_order_id' => 'required|exists:survey_requests,customer_survey_order_id'
        ]);

        $survey = SurveyOrder::with(['payment'])
            ->where('customer_survey_order_id', $validated['customer_survey_order_id'])->firstOrFail();

        return new SurveyOrderResource($survey);
    }


    public function fee(Request $request)
    {
        $validated = $request->validate([
            'customer_survey_order_id' => 'required|string'
        ]);

        $orderId = $validated['customer_survey_order_id'];

        return new PaymentResource($this->payment_service->find($orderId));
    }
}
