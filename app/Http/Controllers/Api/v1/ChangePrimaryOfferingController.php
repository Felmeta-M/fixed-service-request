<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\ErrorCode;
use App\Enums\OfferId;
use App\Http\Controllers\Controller;
use App\Models\SurveyOrder;
use App\Services\ApiResponse;
use App\Services\ChangePrimaryOfferingService;
use App\Services\Logging\AppLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Change Primary Offering Controller
 * 
 * Handles requests to change/upgrade/downgrade subscriber's primary offering (bandwidth plan).
 * 
 * Workflow:
 * 1. First query current offering via PurchasedOfferingController using service number
 *    POST /api/v1/purchased-offering/by-service-number { "service_number": "..." }
 * 2. Extract the 'offering_id' from the response
 * 3. Use that offering_id as 'old_offering_id' here to change the plan
 * 
 * Note: The object_id is typically the customer's service number.
 *       Requires domain expert verification for exact ID mapping.
 */
class ChangePrimaryOfferingController extends Controller
{
    public function __construct(
        protected readonly ChangePrimaryOfferingService $changePrimaryOfferingService,
    ) {
    }

    /**
     * Change primary offering for a subscriber.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function changePrimaryOffering(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_number' => 'required|string',
            'bandwidth' => 'required|string',
        ]);

        // Look up survey order by service number
        // For Data service type: matches service_number
        // For Combo service type: matches fbb_service_number (the data/bandwidth service)
        $surveyOrder = SurveyOrder::where(function ($query) use ($validated) {
                $query->where('service_number', $validated['service_number'])
                    ->orWhere('fbb_service_number', $validated['service_number']);
            })
            ->whereNotNull('customer_subscription_order_id')
            ->latest()
            ->first();

        if (!$surveyOrder) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription found for this service number.',
            ], 404);
        }

        if (!$surveyOrder->canChangeOffer()) {
            return response()->json([
                'success' => false,
                'message' => 'Offer change is not available for this order in its current state.',
            ], 422);
        }

        try {
            $result = $this->changePrimaryOfferingService->changePrimaryOffering($surveyOrder, $validated['bandwidth']);
            if (!$result['success']) {
                return ApiResponse::error(
                    message: $result['error'] ?? $result['ret_msg'] ?? 'Change bandwidth failed',
                    errorCode: ErrorCode::EXTERNAL_SERVICE_ERROR,
                    status: 422,
                    context: [
                        'ret_code' => $result['ret_code'] ?? null,
                        'ret_msg' => $result['ret_msg'] ?? null,
                        'response_time' => $result['response_time'] ?? null,
                    ]
                );
            }

            return ApiResponse::success([
                'message' => $result['message'] ?? 'Primary offering changed successfully',
                'order_id' => $result['order_id'] ?? null,
                'response_time' => $result['response_time'] ?? null,
                'ret_code' => $result['ret_code'] ?? null,
                'ret_msg' => $result['ret_msg'] ?? null,
            ], 'Primary offering changed successfully');
        } catch (\Throwable $e) {
            AppLogger::api()->error('Change primary offering request failed', [
                'service_number' => $validated['service_number'],
                'bandwidth' => $validated['bandwidth'],
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::fromException($e, 'Failed to change primary offering');
        }
    }

}
