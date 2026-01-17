<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ManualSurveyOrderRequest;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Http\Resources\SurveyOrderResource;
use App\Models\SurveyOrder;
use App\Services\ManualSurveyOrderService;
use App\Services\QuerySurveyOrderService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\Logging\AppLogger;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use App\Services\Survey\SurveyServiceFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SurveyOrderController extends Controller
{
    public function __construct(
        protected SurveyServiceFactory $factory,
        protected readonly QuerySurveyOrderService $querySurveyOrderService,
        protected readonly QuerySubscriptionOrderStatusService $querySubscriptionOrderStatusService,
        protected readonly ManualSurveyOrderService $manualSurveyOrderService
    ) {
    }

    /**
     * Display a listing of the resource - optimized with Query Builder
     */
    public function index(Request $request)
    {
        try {
            $customer = auth()->user();

            // Use Query Builder for the main listing query
            $query = DB::table('survey_orders')
                ->leftJoin('payments', 'survey_orders.customer_survey_order_id', '=', 'payments.customer_survey_order_id')
                ->whereNull('survey_orders.deleted_at')
                ->where('survey_orders.customer_code', (string) $customer->customer_code)
                ->select([
                    'survey_orders.id',
                    'survey_orders.customer_survey_order_id',
                    'survey_orders.customer_subscription_order_id',
                    'survey_orders.survey_is_manual',
                    'survey_orders.survey_type',
                    'survey_orders.customer_code',
                    'survey_orders.status',
                    'survey_orders.main_offer_id',
                    'survey_orders.service_number',
                    'survey_orders.with_device',
                    'survey_orders.last_checked_at',
                    'survey_orders.created_at',
                    'survey_orders.updated_at',
                    'payments.id as payment_id',
                    'payments.total_amount as payment_amount',
                    'payments.status as payment_status',
                    'payments.trans_id as payment_trans_id',
                ]);

            // Handle search parameter - search in both customer_survey_order_id and customer_subscription_order_id
            if ($request->filled('search')) {
                $searchTerm = $request->input('search');
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('survey_orders.customer_survey_order_id', 'like', '%' . $searchTerm . '%')
                        ->orWhere('survey_orders.customer_subscription_order_id', 'like', '%' . $searchTerm . '%');
                });
            }


            if ($request->filled('status')) {
                $query->where('survey_orders.status', $request->status);
            }

            $surveyOrders = $query->latest('survey_orders.created_at')->paginate(10);

            // Collect orders that need refresh (WAITING status, not checked in last 5 minutes)
            $ordersToRefresh = collect($surveyOrders->items())
                ->filter(function ($order) {
                    if ($order->status !== FFDServiceProvisionStatus::Waiting->value) {
                        return false;
                    }

                    if ($order->last_checked_at) {
                        $lastChecked = \Carbon\Carbon::parse($order->last_checked_at);
                        if ($lastChecked->diffInMinutes(now()) < 5) {
                            return false;
                        }
                    }

                    return true;
                });

            // Batch refresh orders
            if ($ordersToRefresh->isNotEmpty()) {
                $this->batchRefreshOrders($ordersToRefresh);
            }

            // Transform raw data to match SurveyOrderResource format
            $transformedItems = collect($surveyOrders->items())->map(function ($item) {
                // Convert survey order status to label
                $surveyStatusValue = (int) ($item->status ?? 0);
                $surveyStatusEnum = FFDServiceProvisionStatus::tryFrom($surveyStatusValue);
                $surveyStatusLabel = $surveyStatusEnum ? $surveyStatusEnum->label() : FFDServiceProvisionStatus::Processing->label();

                // Modify labels based on subscription order ID presence
                if (empty($item->customer_subscription_order_id)) {
                    // Manual surveys - no subscription order ID
                    if ($surveyStatusEnum === FFDServiceProvisionStatus::Waiting) {
                        $surveyStatusLabel = 'Waiting Survey';
                    } elseif ($surveyStatusEnum === FFDServiceProvisionStatus::Completed) {
                        $surveyStatusLabel = 'Survey Completed';
                    }
                } else {
                    // Auto surveys - subscription order ID present
                    if ($surveyStatusEnum === FFDServiceProvisionStatus::Waiting) {
                        $surveyStatusLabel = 'Order Waiting';
                    } elseif ($surveyStatusEnum === FFDServiceProvisionStatus::Completed) {
                        $surveyStatusLabel = 'Order Completed';
                    }
                }

                return [
                    'id' => (string) $item->id,
                    'customer_survey_order_id' => $item->customer_survey_order_id,
                    'customer_subscription_order_id' => $item->customer_subscription_order_id ?? null,
                    'survey_type' => $item->survey_type ?? '',
                    'customer_code' => $item->customer_code,
                    'main_offer_id' => $item->main_offer_id,
                    // 'main_offer_name' => $item->main_offer_name,
                    'service_number' => $item->service_number,
                    'with_device' => (bool) $item->with_device,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    'payment' => $item->payment_id ? [
                        'id' => $item->payment_id,
                        'total_amount' => $item->payment_amount,
                    ] : null,
                    'status' => $surveyStatusLabel,
                    'is_paid' => $item->payment_id ? (($item->payment_status == FFDServiceProvisionStatus::Waiting->value) && !empty($item->payment_trans_id)) : false,
                    'can_pay' => ($surveyStatusValue == FFDServiceProvisionStatus::Completed->value) || empty($item->customer_subscription_order_id),
                    'can_subscribe' => ($surveyStatusValue == FFDServiceProvisionStatus::Waiting->value) || empty($item->customer_subscription_order_id),
                    'can_cancel' => empty($item->customer_subscription_order_id),
                ];
            });

            return response()->json([
                'data' => $transformedItems,
                'links' => [
                    'first' => $surveyOrders->url(1),
                    'last' => $surveyOrders->url($surveyOrders->lastPage()),
                    'prev' => $surveyOrders->previousPageUrl(),
                    'next' => $surveyOrders->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $surveyOrders->currentPage(),
                    'from' => $surveyOrders->firstItem(),
                    'last_page' => $surveyOrders->lastPage(),
                    'per_page' => $surveyOrders->perPage(),
                    'to' => $surveyOrders->lastItem(),
                    'total' => $surveyOrders->total(),
                ],
            ]);
        } catch (Throwable $e) {
            AppLogger::business()->error('Failed to fetch survey orders', [
                'customer_code' => $customer->customer_code ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }
    }

    /**
     * Batch refresh multiple orders and update efficiently
     * For auto surveys (survey_is_manual = false): Uses QuerySubscriptionOrderStatusService with customer_subscription_order_id
     * For manual surveys (survey_is_manual = true): Uses QuerySurveyOrderService with customer_survey_order_id
     */
    protected function batchRefreshOrders($orders): void
    {
        $statusUpdates = [];
        $timestampUpdates = [];

        foreach ($orders as $order) {
            try {
                $isManual = (bool) ($order->survey_is_manual ?? true);
                $response = null;

                if (!$isManual && !empty($order->customer_subscription_order_id)) {
                    // Auto survey: Use subscription order status service with customer_subscription_order_id
                    $subscriptionResponse = $this->querySubscriptionOrderStatusService
                        ->queryStatus($order->customer_subscription_order_id);
                    Log::info('subscriptionResponse', [$subscriptionResponse]);
                    if (!empty($subscriptionResponse['success']) && isset($subscriptionResponse['status']) && $subscriptionResponse['status'] > 0) {
                        // Map subscription order status to survey order status (vendor status codes 1-8)
                        // Convert to integer to match database storage
                        $newStatus = (int) $subscriptionResponse['status'];
                        $response = [
                            'success' => true,
                            'status' => $newStatus,
                        ];
                    } else {
                        $response = null;
                    }
                } else {
                    // Manual survey: Use survey order service with customer_survey_order_id
                    $surveyResponse = $this->querySurveyOrderService
                        ->querySurveyOrderDetail($order->customer_survey_order_id);

                    // Extract data from JsonResponse if needed
                    $responseData = $surveyResponse instanceof \Illuminate\Http\JsonResponse
                        ? $surveyResponse->getData(true)
                        : $surveyResponse;

                    // Handle nested structure: ApiResponse::success() wraps data in 'data' key
                    if (!empty($responseData['success']) && isset($responseData['data']['status'])) {
                        $response = [
                            'success' => true,
                            'status' => $responseData['data']['status'],
                        ];
                    } elseif (!empty($responseData['success']) && isset($responseData['status'])) {
                        // Already in correct format (direct array response)
                        $response = $responseData;
                    } else {
                        $response = null;
                    }
                }

                if (empty($response['success']) || empty($response['status'])) {
                    $timestampUpdates[] = $order->id;
                    continue;
                }

                $newStatus = $response['status'];

                if ($order->status !== $newStatus) {
                    $statusUpdates[$order->id] = $newStatus;
                }

                $timestampUpdates[] = $order->id;
            } catch (Throwable $e) {
                AppLogger::business()->warning('Failed to refresh survey order', [
                    'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                    'customer_subscription_order_id' => $order->customer_subscription_order_id ?? null,
                    'survey_is_manual' => $order->survey_is_manual ?? null,
                    'error' => $e->getMessage(),
                ]);
                // Still update last_checked_at even if there was an error
                $timestampUpdates[] = $order->id;
            }
        }

        // Batch update statuses
        if (!empty($statusUpdates)) {
            $cases = [];
            $syncCases = [];
            $ids = [];
            $bindings = [];

            foreach ($statusUpdates as $id => $status) {
                $cases[] = "WHEN id = ? THEN ?";
                $syncCases[] = "WHEN id = ? THEN ?";
                $bindings[] = $id;
                $bindings[] = $status;
                $ids[] = $id;
            }

            foreach ($statusUpdates as $id => $status) {
                $bindings[] = $id;
                $bindings[] = $status;
            }

            $caseStatement = implode(' ', $cases);
            $syncCaseStatement = implode(' ', $syncCases);
            $idPlaceholders = implode(',', array_fill(0, count($ids), '?'));
            $bindings = array_merge($bindings, $ids);

            DB::update(
                "UPDATE survey_orders 
                 SET status = CASE {$caseStatement} END,
                     last_synced_status = CASE {$syncCaseStatement} END,
                     updated_at = NOW()
                 WHERE id IN ({$idPlaceholders})",
                $bindings
            );
        }

        // Batch update timestamps - ensure unique IDs
        if (!empty($timestampUpdates)) {
            $uniqueIds = array_unique($timestampUpdates);
            DB::table('survey_orders')
                ->whereIn('id', $uniqueIds)
                ->update(['last_checked_at' => now()]);
        }
    }

    /**
     * Store a newly created resource - optimized existence check
     */
    public function store(SurveyOrderFormRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $customer = auth()->user();

            // Use Query Builder for existence check - much faster than Eloquent
            $hasBlockedSurvey = DB::table('survey_orders')
                ->whereNull('deleted_at')
                ->where('customer_code', $customer?->customer_code)
                ->whereIn('status', FFDServiceProvisionStatus::blockedForNewRequest())
                ->exists();

            // if ($hasBlockedSurvey) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'You already have an active or completed request.',
            //     ], Response::HTTP_CONFLICT);
            // }

            $service = $this->factory->make($data['main_offer_id']);

            return $service->create($data);
        } catch (ValidationException $e) {
            AppLogger::business()->warning('SurveyOrder validation error', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Please correct the highlighted errors.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found.',
            ], Response::HTTP_NOT_FOUND);
        } catch (QueryException $e) {
            AppLogger::business()->error('SurveyOrder database error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Database error occurred.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (Throwable $e) {
            AppLogger::business()->error('SurveyOrder store error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                // 'message' => 'Something went wrong. Please try again later.',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource - optimized with Query Builder
     * Accepts customer_subscription_order_id (primary) or customer_survey_order_id (fallback)
     */
    public function show(Request $request)
    {
        // Priority: customer_subscription_order_id (for auto surveys) > customer_survey_order_id (for manual surveys)
        $subscriptionOrderId = $request->input('customer_subscription_order_id');
        $surveyOrderId = $request->input('customer_survey_order_id');

        if (!$subscriptionOrderId && !$surveyOrderId) {
            return response()->json([
                'success' => false,
                'message' => 'Order ID is required (customer_subscription_order_id or customer_survey_order_id).',
            ], 400);
        }

        // Use Query Builder with join for single query
        $query = DB::table('survey_orders')
            ->leftJoin('payments', 'survey_orders.customer_survey_order_id', '=', 'payments.customer_survey_order_id')
            ->whereNull('survey_orders.deleted_at');

        // Prioritize customer_subscription_order_id if provided
        if ($subscriptionOrderId) {
            $query->where('survey_orders.customer_subscription_order_id', (string) $subscriptionOrderId);
        } else {
            $query->where('survey_orders.customer_survey_order_id', (string) $surveyOrderId);
        }

        $surveyRequest = $query
            ->select([
                'survey_orders.*',
                'payments.id as payment_id',
                'payments.total_amount as payment_amount',
                'payments.status as payment_status',
                'payments.merch_order_id as payment_merch_order_id',
                'payments.trans_id as payment_trans_id',
            ])
            ->first();

        if (!$surveyRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        // Transform to resource format
        return response()->json([
            'success' => true,
            'data' => $this->transformOrder($surveyRequest),
        ]);
    }

    /**
     * Update the specified resource - optimized with Query Builder
     */
    public function update(Request $request)
    {
        $request->validate([
            'customer_code' => 'required|string',
            'customer_survey_order_id' => 'required|string',
            'status' => 'required|string|in:Completed,Canceled,Waiting',
        ]);

        $customerCode = $request->input('customer_code');
        $orderId = $request->input('customer_survey_order_id');

        // Direct Query Builder update - single query
        $updated = DB::table('survey_orders')
            ->whereNull('deleted_at')
            ->where('customer_code', $customerCode)
            ->where('customer_survey_order_id', $orderId)
            ->update([
                'status' => $request->status,
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        // Fetch updated record
        $surveyRequest = DB::table('survey_orders')
            ->where('customer_survey_order_id', $orderId)
            ->first();

        return response()->json([
            'success' => true,
            'message' => "Survey request status updated to '{$request->status}'.",
            'data' => $surveyRequest,
        ]);
    }

    /**
     * Remove the specified resource - optimized with Query Builder
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'customer_code' => 'required|string',
            'customer_survey_order_id' => 'required|string',
        ]);

        // Soft delete using Query Builder - single query
        $deleted = DB::table('survey_orders')
            ->whereNull('deleted_at')
            ->where('customer_code', $request->customer_code)
            ->where('customer_survey_order_id', $request->customer_survey_order_id)
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Survey request deleted successfully.',
        ], 200);
    }

    /**
     * Transform raw order data to resource format
     */
    protected function transformOrder($order): array
    {
        // Convert survey order status to label
        $surveyStatusValue = (int) ($order->status ?? 0);
        $surveyStatusEnum = FFDServiceProvisionStatus::tryFrom($surveyStatusValue);
        $surveyStatusLabel = $surveyStatusEnum ? $surveyStatusEnum->label() : 'Unknown';

        // Modify labels based on subscription order ID presence
        if (empty($order->customer_subscription_order_id)) {
            // Manual surveys - no subscription order ID
            if ($surveyStatusEnum === FFDServiceProvisionStatus::Waiting) {
                $surveyStatusLabel = 'Waiting Survey';
            } elseif ($surveyStatusEnum === FFDServiceProvisionStatus::Completed) {
                $surveyStatusLabel = 'Survey Completed';
            }
        } else {
            // Auto surveys - subscription order ID present
            if ($surveyStatusEnum === FFDServiceProvisionStatus::Waiting) {
                $surveyStatusLabel = 'Subscription Waiting';
            } elseif ($surveyStatusEnum === FFDServiceProvisionStatus::Completed) {
                $surveyStatusLabel = 'Subscription Completed';
            }
        }

        return [
            'id' => (string) $order->id,
            'customer_survey_order_id' => $order->customer_survey_order_id,
            'customer_subscription_order_id' => $order->customer_subscription_order_id ?? null,
            'survey_type' => $order->survey_type ?? '',
            'customer_code' => $order->customer_code,
            'main_offer_id' => $order->main_offer_id,
            // 'main_offer_name' => $order->main_offer_name ?? null,
            'service_number' => $order->service_number ?? null,
            'with_device' => (bool) ($order->with_device ?? false),
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'payment' => isset($order->payment_id) ? [
                'id' => $order->payment_id,
                'total_amount' => $order->payment_amount,
                'merch_order_id' => $order->payment_merch_order_id ?? null,
            ] : null,
            // Status at root level (survey order status label)
            'status' => $surveyStatusLabel,
            'is_paid' => isset($order->payment_id) ? (($order->payment_status == FFDServiceProvisionStatus::Paid->value) && !empty($order->payment_trans_id)) : false,
            'can_pay' => ($surveyStatusValue == FFDServiceProvisionStatus::Completed->value) || empty($order->customer_subscription_order_id),
            'can_subscribe' => ($surveyStatusValue == FFDServiceProvisionStatus::Waiting->value) || empty($order->customer_subscription_order_id),
            'can_cancel' => !empty($order->customer_subscription_order_id),
        ];
    }

    /**
     * Create a manual survey order via BSS IECAF.
     *
     * This endpoint creates survey orders manually through the ECAF system,
     * typically used for administrative or backend survey order creation.
     *
     * @param ManualSurveyOrderRequest $request Validated manual survey request
     * @return JsonResponse
     */
    public function storeManual(ManualSurveyOrderRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            AppLogger::business()->info('Manual survey order creation started', [
                'customer_code' => $data['customer_code'],
                'survey_type' => $data['survey_type'],
                'telecom_region' => $data['telecom_region'],
            ]);

            // Check for existing active survey orders for this customer (optional)
            $hasBlockedSurvey = DB::table('survey_orders')
                ->whereNull('deleted_at')
                ->where('customer_code', $data['customer_code'])
                ->whereIn('status', FFDServiceProvisionStatus::blockedForNewRequest())
                ->exists();

            if ($hasBlockedSurvey) {
                AppLogger::business()->warning('Manual survey blocked - existing active order', [
                    'customer_code' => $data['customer_code'],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Customer already has an active survey order.',
                ], Response::HTTP_CONFLICT);
            }

            // Create the manual survey order via BSS
            $result = $this->manualSurveyOrderService->createSurveyOrder($data);

            return $result;
        } catch (ValidationException $e) {
            AppLogger::business()->warning('Manual survey validation error', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed. Please correct the highlighted errors.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (QueryException $e) {
            AppLogger::business()->error('Manual survey database error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Database error occurred while creating manual survey order.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (Throwable $e) {
            AppLogger::business()->exception($e, 'Manual survey order creation failed');

            return response()->json([
                'success' => false,
                'message' => 'Failed to create manual survey order. Please try again later.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
