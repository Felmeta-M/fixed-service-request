<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use App\Services\QuerySubscriptionOrderStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionOrderStatusController extends Controller
{
    public function __construct(
        protected readonly QuerySubscriptionOrderStatusService $subscriptionOrderStatusService,
    ) {}

    /**
     * Query the status of a subscription order.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|string',
            'start_time' => 'nullable|string|date_format:YmdHis',
            'end_time' => 'nullable|string|date_format:YmdHis',
        ]);

        try {
            $result = $this->subscriptionOrderStatusService->queryStatus(
                $validated['order_id'],
                $validated['start_time'] ?? null,
                $validated['end_time'] ?? null
            );

            if (!$result['success']) {
                return ApiResponse::error($result['error'] ?? 'Query subscription order status failed', 400);
            }

            return ApiResponse::success($result);
        } catch (\Throwable $e) {
            AppLogger::api()->error('Subscription order status query failed', [
                'order_id' => $validated['order_id'],
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::fromException($e, 'Failed to query subscription order status');
        }
    }

    /**
     * Get status labels mapping.
     *
     * @return JsonResponse
     */
    public function statusLabels(): JsonResponse
    {
        return ApiResponse::success([
            'status_codes' => QuerySubscriptionOrderStatusService::STATUS_LABELS,
        ]);
    }
}
