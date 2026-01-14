<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use App\Services\QueryPurchasedOfferingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Purchased Offering Controller
 * 
 * Queries subscriber's current/purchased primary offering.
 * The 'offering_id' from the response is used as 'old_offering_id' 
 * in ChangePrimaryOfferingController for upgrade/downgrade operations.
 * 
 * @see ChangePrimaryOfferingController
 */
class PurchasedOfferingController extends Controller
{
    public function __construct(
        protected readonly QueryPurchasedOfferingService $purchasedOfferingService,
    ) {}

    /**
     * Query purchased primary offering by object ID.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'object_id' => 'required|string',
            'object_id_type' => 'nullable|integer|in:1,2,4',
        ]);

        try {
            $result = $this->purchasedOfferingService->queryByObjectId(
                $validated['object_id'],
                $validated['object_id_type'] ?? QueryPurchasedOfferingService::OBJECT_TYPE_SUBSCRIBER
            );

            if (!$result['success']) {
                return ApiResponse::error($result['error'] ?? 'Query purchased offering failed', 400);
            }

            return ApiResponse::success($result);
        } catch (\Throwable $e) {
            AppLogger::api()->error('Purchased offering query failed', [
                'object_id' => $validated['object_id'],
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::fromException($e, 'Failed to query purchased offering');
        }
    }

    /**
     * Query purchased offering by service number.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function queryByServiceNumber(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_number' => 'required|string',
        ]);

        try {
            $result = $this->purchasedOfferingService->queryByServiceNumber(
                $validated['service_number']
            );

            if (!$result['success']) {
                return ApiResponse::error($result['error'] ?? 'Query purchased offering failed', 400);
            }

            return ApiResponse::success($result);
        } catch (\Throwable $e) {
            AppLogger::api()->error('Purchased offering query by service number failed', [
                'service_number' => $validated['service_number'],
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::fromException($e, 'Failed to query purchased offering');
        }
    }

    /**
     * Get object ID type constants.
     *
     * @return JsonResponse
     */
    public function objectTypes(): JsonResponse
    {
        return ApiResponse::success([
            'object_id_types' => [
                QueryPurchasedOfferingService::OBJECT_TYPE_CUSTOMER => 'Customer',
                QueryPurchasedOfferingService::OBJECT_TYPE_ACCOUNT => 'Account',
                QueryPurchasedOfferingService::OBJECT_TYPE_SUBSCRIBER => 'Subscriber',
            ],
        ]);
    }
}
