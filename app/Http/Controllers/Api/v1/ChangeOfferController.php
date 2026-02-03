<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\SurveyOrder;
use App\Services\ChangeOfferService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChangeOfferController extends Controller
{
    public function __construct(protected readonly ChangeOfferService $changeOfferService) {}

    public function changePrimaryOffering(Request $request)
    {
        $rules = [
            'customer_survey_order_id' => 'required|string|exists:survey_orders,customer_survey_order_id',
            'new_value' => 'required|string',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $validated = $validator->validated();

        // Fetch survey order by customer_survey_order_id
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $validated['customer_survey_order_id'])->first();

        if (!$surveyOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Survey order not found.',
            ], 404);
        }

        // Validate required fields from survey order (use new attributes)
        $primaryNumber = $surveyOrder->voice_service_number ?? $surveyOrder->data_service_number;
        if (!$primaryNumber) {
            return response()->json([
                'success' => false,
                'message' => 'Service number is missing in survey order.',
            ], 422);
        }

        if (!$surveyOrder->main_offer_id) {
            return response()->json([
                'success' => false,
                'message' => 'Main offer ID is missing in survey order.',
            ], 422);
        }

        if (!$surveyOrder->bandwidth) {
            return response()->json([
                'success' => false,
                'message' => 'Bandwidth is missing in survey order.',
            ], 422);
        }

        return $this->changeOfferService->changePrimaryOffering(
            serviceNumber: $primaryNumber,
            oldOfferingId: $surveyOrder->main_offer_id,
            newOfferingId: $surveyOrder->main_offer_id,
            oldValue: $surveyOrder->bandwidth,
            value: $validated['new_value']
        );
    }
}
