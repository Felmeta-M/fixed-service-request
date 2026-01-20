<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ManualSurveyOrderRequest;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Models\SurveyOrder;
use App\Services\ManualSurveyOrderService;
use App\Services\QueryPurchasedOfferingService;
use App\Services\QuerySurveyOrderService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\Logging\AppLogger;
use App\Services\Survey\SurveyServiceFactory;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class SurveyOrderController extends Controller
{
    public function __construct(
        protected SurveyServiceFactory $factory,
        protected readonly QuerySurveyOrderService $querySurveyOrderService,
        protected readonly QuerySubscriptionOrderStatusService $querySubscriptionOrderStatusService,
        protected readonly QueryPurchasedOfferingService $queryPurchasedOfferingService,
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
                    'survey_orders.bandwidth',
                    'survey_orders.cable_length',
                    'survey_orders.with_device',
                    'survey_orders.last_checked_at',
                    'survey_orders.created_at',
                    'survey_orders.updated_at',
                    'payments.id as payment_id',
                    'payments.subscription_fee as payment_subscription_fee',
                    'payments.device_fee as payment_device_fee',
                    'payments.cable_charge as payment_cable_charge',
                    'payments.total_amount as payment_total_amount',
                    'payments.status as payment_status',
                    'payments.trans_id as payment_trans_id',
                    'payments.merch_order_id as payment_merch_order_id',
                    'payments.payment_order_id as payment_payment_order_id',
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

            // Accept per_page from request (default 10, max 100)
            $perPage = min((int) $request->input('per_page', 10), 100);

            $surveyOrders = $query->latest('survey_orders.created_at')->paginate($perPage);

            // Collect orders that need refresh (WAITING status, not checked in last 5 minutes)
            $ordersToRefresh = collect($surveyOrders->items())
                ->filter(fn($order) => SurveyOrder::needsRefresh($order));

            // Batch refresh orders (for WAITING status - check order status)
            if ($ordersToRefresh->isNotEmpty()) {
                $this->batchRefreshOrders($ordersToRefresh);
            }

            // Transform raw data to API format
            $transformedItems = collect($surveyOrders->items())->map(fn($item) => $this->transformOrder($item));

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
                // Handle PostgreSQL boolean values (can be true, false, 't', 'f', '1', '0', 1, 0)
                $rawManual = $order->survey_is_manual ?? true;
                $isManual = $rawManual === true || $rawManual === 't' || $rawManual === 1 || $rawManual === '1';
                $response = null;

                //subscription order
                if (!empty($order->customer_subscription_order_id)) {
                    // Auto survey: Use subscription order status service with customer_subscription_order_id
                    $subscriptionResponse = $this->querySubscriptionOrderStatusService
                        ->queryStatus($order->customer_subscription_order_id);

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
                }

                //manual survey order
                if ($isManual && empty($order->customer_subscription_order_id)) {
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

                if (empty($response['success']) || !isset($response['status'])) {
                    $timestampUpdates[] = $order->id;
                    continue;
                }

                // Third party API status always has priority - overwrite local DB status
                // Only accept valid status codes (1-8 matching FFDServiceProvisionStatus enum)
                $newStatus = (int) $response['status'];
                if ($newStatus >= 1 && $newStatus <= 8) {
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
     * Routes to manual service when survey_is_manual is true (skips geo-fencing validation)
     */
    public function store(SurveyOrderFormRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $customer = auth()->user();

            // Uncomment to enable blocking duplicate requests:
            // $hasBlockedSurvey = SurveyOrder::blockedForNewRequest($customer?->customer_code)->exists();
            // if ($hasBlockedSurvey) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'You already have an active or completed request.',
            //     ], Response::HTTP_CONFLICT);
            // }

            // For manual surveys, use the manual service (no geo-fencing/resource validation)
            if (!empty($data['survey_is_manual'])) {
                return $this->manualSurveyOrderService->createSurveyOrder($data);
            }

            // For auto surveys, use the factory-based service (requires encrypted resource data)
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
        $subscriptionOrderId = $request->input('customer_subscription_order_id');
        $surveyOrderId = $request->input('customer_survey_order_id');

        if (!$subscriptionOrderId && !$surveyOrderId) {
            return response()->json([
                'success' => false,
                'message' => 'Order ID is required (customer_subscription_order_id or customer_survey_order_id).',
            ], 400);
        }

        // Fetch survey order with payment data
        $surveyRequest = $this->fetchSurveyOrder($subscriptionOrderId, $surveyOrderId);

        if (!$surveyRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        // Refresh offering for completed orders (check if bandwidth changed)
        // If updated, re-fetch to get fresh data
        if ($this->refreshOfferingIfNeeded($surveyRequest)) {
            $surveyRequest = $this->fetchSurveyOrder($subscriptionOrderId, $surveyOrderId);
        }

        // Transform to resource format
        return response()->json([
            'success' => true,
            'data' => $this->transformOrder($surveyRequest),
        ]);
    }

    /**
     * Fetch survey order with payment data.
     */
    protected function fetchSurveyOrder(?string $subscriptionOrderId, ?string $surveyOrderId): ?object
    {
        $query = DB::table('survey_orders')
            ->leftJoin('payments', 'survey_orders.customer_survey_order_id', '=', 'payments.customer_survey_order_id')
            ->whereNull('survey_orders.deleted_at')
            ->select([
                'survey_orders.*',
                'payments.id as payment_id',
                'payments.subscription_fee as payment_subscription_fee',
                'payments.device_fee as payment_device_fee',
                'payments.cable_charge as payment_cable_charge',
                'payments.total_amount as payment_total_amount',
                'payments.status as payment_status',
                'payments.payment_order_id as payment_payment_order_id',
                'payments.merch_order_id as payment_merch_order_id',
                'payments.trans_id as payment_trans_id',
            ]);

        if ($subscriptionOrderId) {
            $query->where('survey_orders.customer_subscription_order_id', (string) $subscriptionOrderId);
        } else {
            $query->where('survey_orders.customer_survey_order_id', (string) $surveyOrderId);
        }

        return $query->first();
    }

    /**
     * Refresh offering for a completed order if needed.
     * Checks if bandwidth changed via other channels.
     * Returns true if data was updated (caller should re-fetch).
     */
    protected function refreshOfferingIfNeeded(object $order): bool
    {
        // Only for completed orders with subscription and service_number
        if ((int) $order->status !== FFDServiceProvisionStatus::Completed->value) {
            return false;
        }

        if (empty($order->customer_subscription_order_id) || empty($order->service_number)) {
            return false;
        }

        try {
            // Query current purchased offering
            $response = $this->queryPurchasedOfferingService
                ->queryByServiceNumber($order->service_number);

            if (empty($response['success'])) {
                return false;
            }

            // Check if bandwidth changed
            $currentBandwidth = $response['bandwidth'] ?? null;
            if ($currentBandwidth && $currentBandwidth !== $order->bandwidth) {
                DB::table('survey_orders')
                    ->where('id', $order->id)
                    ->update([
                        'bandwidth' => $currentBandwidth,
                        'updated_at' => now(),
                    ]);

                // AppLogger::business()->info('Offering bandwidth updated on show', [
                //     'customer_survey_order_id' => $order->customer_survey_order_id,
                //     'service_number' => $order->service_number,
                //     'old_bandwidth' => $order->bandwidth,
                //     'new_bandwidth' => $currentBandwidth,
                // ]);

                return true;
            }
        } catch (Throwable $e) {
            AppLogger::business()->warning('Failed to refresh offering on show', [
                'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                'error' => $e->getMessage(),
            ]);
        }

        return false;
    }

    /**
     * Transform raw order data to API response format.
     */
    protected function transformOrder(object $order): array
    {
        $status = (int) ($order->status ?? 0);
        $paymentAmount = (float) ($order->payment_total_amount ?? 0);
        $paymentTransId = $order->payment_trans_id ?? null;
        $subscriptionOrderId = $order->customer_subscription_order_id ?? null;
        $paymentId = $order->payment_id ?? null;
        $paymentStatus = (int) ($order->payment_status ?? 0);

        return [
            'customer_survey_order_id' => $order->customer_survey_order_id,
            'customer_subscription_order_id' => $subscriptionOrderId,
            'survey_type' => $order->survey_type ?? '',
            'customer_code' => $order->customer_code,
            'main_offer_id' => $order->main_offer_id,
            'service_number' => $order->service_number ?? null,
            'bandwidth' => $order->bandwidth ?? null,
            'cable_length' => $order->cable_length ?? null,
            'with_device' => (bool) ($order->with_device ?? false),
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'payment' => $paymentId ? [
                'subscription_fee' => (float) ($order->payment_subscription_fee ?? 0),
                'device_fee' => (float) ($order->payment_device_fee ?? 0),
                'cable_charge' => (float) ($order->payment_cable_charge ?? 0),
                'total_amount' => (float) ($order->payment_total_amount ?? 0),
                'merch_order_id' => $order->payment_merch_order_id ?? null,
            ] : null,
            'status' => $this->getStatusLabel($order),
            'is_paid' => SurveyOrder::checkIsPaid($paymentStatus, $paymentTransId),
            'can_pay' => SurveyOrder::checkCanPay($status, $paymentAmount, $paymentTransId),
            'can_subscribe' => SurveyOrder::checkCanSubscribe($status, $paymentAmount, $paymentTransId, $subscriptionOrderId),
            'can_change_offer' => SurveyOrder::checkCanChangeOffer($status, $subscriptionOrderId),
            'can_cancel' => SurveyOrder::checkCanCancel($status, $subscriptionOrderId, $paymentTransId),
            'can_terminate' => SurveyOrder::checkCanTerminate($status, $subscriptionOrderId),
        ];
    }

    /**
     * Get status label based on order phase, payment status, and survey type.
     * 
     * Manual Survey (survey_is_manual = true):
     *   - Waiting → "Waiting" (pending physical survey by field team)
     * 
     * Auto Survey (survey_is_manual = false):
     *   Phase 1 (Survey): No subscription order yet
     *     - Waiting → "Waiting Survey"
     *     - Completed + has payment + not paid → "Pending Payment"
     *     - Completed + free or paid → "Survey Completed"
     *   
     *   Phase 2 (Subscription): Has subscription order
     *     - Waiting → "Order Waiting"
     *     - Completed → "Order Completed"
     */
    protected function getStatusLabel(object $order): string
    {
        $statusEnum = FFDServiceProvisionStatus::tryFrom((int) ($order->status ?? 0));
        $hasSubscription = !empty($order->customer_subscription_order_id);
        $paymentAmount = (float) ($order->payment_total_amount ?? 0);
        $paymentTransId = $order->payment_trans_id ?? null;
        $isPaid = !empty($paymentTransId);
        $hasPayment = $paymentAmount > 0;
        // Handle PostgreSQL boolean values (can be true, false, 't', 'f', '1', '0', 1, 0)
        $rawManual = $order->survey_is_manual ?? false;
        $isManual = $rawManual === true || $rawManual === 't' || $rawManual === 1 || $rawManual === '1';

        // In-progress statuses for manual survey (Created, Waiting, Processing)
        $manualInProgress = in_array($statusEnum, [
            FFDServiceProvisionStatus::Created,
            FFDServiceProvisionStatus::Waiting,
            FFDServiceProvisionStatus::Processing,
        ], true);

        return match (true) {
            // Manual survey: In progress (Created/Waiting/Processing) - pending physical survey by field team
            $isManual && $manualInProgress && !$hasSubscription => 'Waiting',

            // Phase 2: Subscription phase (has subscription order)
            $statusEnum === FFDServiceProvisionStatus::Waiting && $hasSubscription => 'Order Waiting',
            $statusEnum === FFDServiceProvisionStatus::Completed && $hasSubscription => 'Order Completed',

            // Phase 1: Survey phase (no subscription order) - Auto survey only
            // Paid but not yet subscribed (status becomes Waiting after payment)
            $statusEnum === FFDServiceProvisionStatus::Waiting && !$hasSubscription && $isPaid => 'Paid',
            // Survey in progress
            $statusEnum === FFDServiceProvisionStatus::Waiting && !$hasSubscription => 'Waiting Survey',
            // Survey completed but payment pending
            $statusEnum === FFDServiceProvisionStatus::Completed && !$hasSubscription && $hasPayment && !$isPaid => 'Pending Payment',
            // Survey completed (free or ready to subscribe)
            $statusEnum === FFDServiceProvisionStatus::Completed && !$hasSubscription => 'Survey Completed',

            // Default: Use enum label
            default => $statusEnum?->label() ?? FFDServiceProvisionStatus::Processing->label(),
        };
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

            // AppLogger::business()->info('Manual survey order creation started', [
            //     'customer_code' => $data['customer_code'],
            //     'survey_type' => $data['survey_type'],
            //     'telecom_region' => $data['telecom_region'],
            // ]);

            // Check for existing active survey orders for this customer
            $hasBlockedSurvey = SurveyOrder::blockedForNewRequest($data['customer_code'])->exists();

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
