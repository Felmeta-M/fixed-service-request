<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\ApiResponse;
use App\Services\ChangeBandwidthService;
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
class ChangeBandwidthController extends Controller
{
    public function __construct(
        protected readonly ChangeBandwidthService $changeBandwidthService,
    ) {}

    /**
     * Change primary offering for a subscriber.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function changeBandwidth(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_number' => 'required|string',
            'bandwidth' => 'required|string',
        ]);

        try {
            $result = $this->changeBandwidthService->changeBandwidth($validated['service_number'], $validated['bandwidth']);
            if (!$result['success']) {
                return ApiResponse::error(
                    $result['error'] ?? 'Change bandwidth failed',
                    422,
                    $result['error'] ?? 'Change bandwidth failed'
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
