<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
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
    ) {}

    /**
     * Change primary offering for a subscriber.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function change(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'object_id' => 'required|string',
            'old_offering_id' => 'required|string',
            'new_offering_id' => 'nullable|string',
            'object_id_type' => 'nullable|integer|in:' . implode(',', [
                ChangePrimaryOfferingService::OBJECT_TYPE_CUSTOMER,
                ChangePrimaryOfferingService::OBJECT_TYPE_ACCOUNT,
                ChangePrimaryOfferingService::OBJECT_TYPE_SUBSCRIBER,
            ]),
        ]);

        try {
            $result = $this->changePrimaryOfferingService->changeOffering(
                $validated['object_id'],
                $validated['old_offering_id'],
                $validated['new_offering_id'] ?? null,
                $validated['object_id_type'] ?? ChangePrimaryOfferingService::OBJECT_TYPE_SUBSCRIBER
            );

            if (!$result['success']) {
                return ApiResponse::error(
                    $result['error'] ?? 'Change primary offering failed',
                    422,
                    $result['error'] ?? 'Change primary offering failed'
                );
            }

            return ApiResponse::success($result, 'Primary offering changed successfully');
        } catch (\Throwable $e) {
            AppLogger::api()->error('Change primary offering request failed', [
                'object_id' => $validated['object_id'],
                'old_offering_id' => $validated['old_offering_id'],
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::fromException($e, 'Failed to change primary offering');
        }
    }

    /**
     * Change bandwidth offering for a subscriber (convenience endpoint).
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function changeBandwidth(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subscriber_id' => 'required|string',
            'current_offering_id' => 'required|string',
            'new_offering_id' => 'nullable|string',
        ]);

        try {
            $result = $this->changePrimaryOfferingService->changeBandwidth(
                $validated['subscriber_id'],
                $validated['current_offering_id'],
                $validated['new_offering_id'] ?? null
            );

            if (!$result['success']) {
                return ApiResponse::error(
                    $result['error'] ?? 'Change bandwidth failed',
                    422,
                    $result['error'] ?? 'Change bandwidth failed'
                );
            }

            return ApiResponse::success($result, 'Bandwidth changed successfully');
        } catch (\Throwable $e) {
            AppLogger::api()->error('Change bandwidth request failed', [
                'subscriber_id' => $validated['subscriber_id'],
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::fromException($e, 'Failed to change bandwidth');
        }
    }

    /**
     * Get available object ID types.
     * 
     * @return JsonResponse
     */
    public function objectTypes(): JsonResponse
    {
        return ApiResponse::success([
            'object_types' => [
                'customer' => ChangePrimaryOfferingService::OBJECT_TYPE_CUSTOMER,
                'account' => ChangePrimaryOfferingService::OBJECT_TYPE_ACCOUNT,
                'subscriber' => ChangePrimaryOfferingService::OBJECT_TYPE_SUBSCRIBER,
            ],
            'default' => ChangePrimaryOfferingService::OBJECT_TYPE_SUBSCRIBER,
        ]);
    }
}
