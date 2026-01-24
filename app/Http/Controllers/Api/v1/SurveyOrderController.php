<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Helpers\BandwidthHelper;
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
                    'survey_orders.fbb_service_number',
                    'survey_orders.bandwidth',
                    'survey_orders.cable_length',
                    'survey_orders.cable_type',
                    'survey_orders.media_type',
                    'survey_orders.line_indicator',
                    'survey_orders.survey_failure_reason',
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
        $surveyResultUpdates = []; // For manual survey result fields
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
                            'survey_result' => $responseData['data']['survey_result'] ?? null,
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

                // For manual surveys, check survey_result to determine actual status
                // If 50005 = -1, survey FAILED regardless of BSS order status
                if ($isManual && !empty($response['survey_result'])) {
                    $surveyResult = $response['survey_result'];

                    if (!empty($surveyResult['survey_failed'])) {
                        // Survey FAILED (50005 = -1)
                        // Override status to Failed and save failure reason
                        $statusUpdates[$order->id] = FFDServiceProvisionStatus::Failed->value;
                        $surveyResultUpdates[$order->id] = [
                            'media_type' => null,
                            'cable_type' => null,
                            'line_indicator' => null,
                            'survey_failure_reason' => $surveyResult['survey_failure_reason'] ?? 'Survey failed',
                        ];
                    } else {
                        // Survey COMPLETED (50005 = PON/COPPER)
                        // Set status to Completed and save survey result fields for device selection
                        $statusUpdates[$order->id] = FFDServiceProvisionStatus::Completed->value;
                        $surveyResultUpdates[$order->id] = [
                            'media_type' => $surveyResult['media_type'] ?? null,
                            'cable_type' => $surveyResult['cable_type'] ?? null,
                            'line_indicator' => $surveyResult['line_indicator'] ?? null,
                            'survey_failure_reason' => null, // Clear any previous failure reason
                        ];
                    }
                } else {
                    // Non-manual surveys or no survey_result: use BSS status directly
                    // Only accept valid status codes (1-8 matching FFDServiceProvisionStatus enum)
                    $newStatus = (int) $response['status'];
                    if ($newStatus >= 1 && $newStatus <= 8) {
                        $statusUpdates[$order->id] = $newStatus;
                    }
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

        // Update survey result fields for manual surveys (individual updates for now)
        // These fields are critical for device selection after manual survey completion
        // Note: We update ALL fields including null to clear previous values (e.g., clear failure_reason on success)
        foreach ($surveyResultUpdates as $orderId => $fields) {
            if (!empty($fields)) {
                $fields['updated_at'] = now();
                DB::table('survey_orders')
                    ->where('id', $orderId)
                    ->update($fields);
            }
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
                // DB::table('survey_orders')
                //     ->where('id', $order->id)
                //     ->update([
                //         'bandwidth' => $currentBandwidth,
                //         'updated_at' => now(),
                //     ]);

                // AppLogger::business()->info('Offering bandwidth updated on show', [
                //     'customer_survey_order_id' => $order->customer_survey_order_id,
                //     'service_number' => $order->service_number,
                //     'old_bandwidth' => $order->bandwidth,
                //     'new_bandwidth' => $currentBandwidth,
                // ]);

                // return true;
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

        // Handle PostgreSQL boolean values for survey_is_manual
        $rawManual = $order->survey_is_manual ?? false;
        $isManualSurvey = $rawManual === true || $rawManual === 't' || $rawManual === 1 || $rawManual === '1';

        // For manual surveys, with_device is null until customer selects device
        // For auto surveys, with_device is always set from the initial request
        $rawWithDevice = $order->with_device ?? null;
        $withDevice = $rawWithDevice === null ? null : (bool) $rawWithDevice;

        // Survey failure reason (for manual surveys)
        $surveyFailureReason = $order->survey_failure_reason ?? null;

        return [
            'customer_survey_order_id' => $order->customer_survey_order_id,
            'customer_subscription_order_id' => $subscriptionOrderId,
            'survey_type' => $order->survey_type ?? '',
            'customer_code' => $order->customer_code,
            'main_offer_id' => $order->main_offer_id,
            'service_number' => $order->service_number ?? null,
            'fbb_service_number' => $order->fbb_service_number ?? null,
            // Internet credentials for device configuration (Data and Combo services)
            'internet_account' => $order->internet_account ?? null,
            'internet_password' => $order->internet_password ?? null,
            // Backend is single source of truth - return formatted for display
            'bandwidth' => BandwidthHelper::format($order->bandwidth),
            'bandwidth_raw' => $order->bandwidth ?? null, // Raw KB value for debugging/API use
            'cable_length' => $order->cable_length ?? null,
            'cable_type' => $order->cable_type ?? null, // BSS param 50056: 0=copper, 1=fiber, 2=EPON, 3=GPON, 5=without survey
            'media_type' => $order->media_type ?? null, // BSS param 50005: PON (fiber) or COPPER, null if failed
            'line_indicator' => $order->line_indicator ?? null, // BSS param 50112: 0=same line, 1=separate line
            'survey_failure_reason' => $order->survey_failure_reason ?? null, // Reason when survey failed (50005 = -1)
            'survey_is_manual' => $isManualSurvey,
            'with_device' => $withDevice,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'payment' => $paymentId ? [
                'subscription_fee' => (float) ($order->payment_subscription_fee ?? 0),
                'device_fee' => (float) ($order->payment_device_fee ?? 0),
                'cable_charge' => (float) ($order->payment_cable_charge ?? 0),
                'total_amount' => (float) ($order->payment_total_amount ?? 0),
                'merch_order_id' => $order->payment_merch_order_id ?? null,
                'status' => $this->getPaymentStatusLabel($paymentStatus),
            ] : null,
            'status' => $this->getStatusLabel($order),
            'is_paid' => SurveyOrder::checkIsPaid($paymentStatus, $paymentTransId),
            // Action permissions - single source of truth from model
            'can_continue' => SurveyOrder::checkCanContinue($status, $isManualSurvey, $withDevice, $subscriptionOrderId, $surveyFailureReason),
            'can_pay' => SurveyOrder::checkCanPay($status, $paymentAmount, $paymentTransId, $subscriptionOrderId, $isManualSurvey, $withDevice),
            'can_subscribe' => SurveyOrder::checkCanSubscribe($status, $paymentAmount, $paymentTransId, $subscriptionOrderId, $isManualSurvey, $withDevice),
            'can_change_offer' => SurveyOrder::checkCanChangeOffer($status, $subscriptionOrderId),
            'can_cancel' => SurveyOrder::checkCanCancel($status, $subscriptionOrderId, $paymentTransId),
            'can_terminate' => SurveyOrder::checkCanTerminate($status, $subscriptionOrderId),
        ];
    }

    /**
     * Get status label based on order phase, payment status, and survey type.
     * 
     * Manual Survey (survey_is_manual = true):
     *   - In Progress (Created/Waiting/Processing) → "Waiting" (pending physical survey)
     *   - Completed + device not selected → "Device Selection"
     *   - Completed + device selected + not paid → "Pending Payment"
     *   - Completed + paid → "Paid"
     *   - Has subscription + Waiting → "Order Waiting"
     *   - Has subscription + Completed → "Order Completed"
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

        // Handle with_device for manual surveys
        $rawWithDevice = $order->with_device ?? null;
        $deviceSelected = $rawWithDevice !== null;

        // In-progress statuses for manual survey (Created, Waiting, Processing)
        $manualInProgress = in_array($statusEnum, [
            FFDServiceProvisionStatus::Created,
            FFDServiceProvisionStatus::Waiting,
            FFDServiceProvisionStatus::Processing,
        ], true);

        return match (true) {
            // Failed/Cancelled - same for both auto and manual
            $statusEnum === FFDServiceProvisionStatus::Failed => 'Failed',
            $statusEnum === FFDServiceProvisionStatus::Cancelled => 'Cancelled',

            // Phase 2: Subscription phase (has subscription order) - same for both
            $statusEnum === FFDServiceProvisionStatus::Waiting && $hasSubscription => 'Order Waiting',
            $statusEnum === FFDServiceProvisionStatus::Completed && $hasSubscription => 'Order Completed',

            // ===== MANUAL SURVEY FLOW =====
            // Manual survey: In progress - pending physical survey by field team
            $isManual && $manualInProgress && !$hasSubscription => 'Waiting',
            // Manual survey: Completed but device not yet selected
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && !$deviceSelected && !$hasSubscription => 'Device Selection',
            // Manual survey: Device selected, payment pending
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && $deviceSelected && $hasPayment && !$isPaid && !$hasSubscription => 'Pending Payment',
            // Manual survey: Paid, waiting for subscription
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && $deviceSelected && $isPaid && !$hasSubscription => 'Paid',
            // Manual survey: Free service, device selected, ready to subscribe
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && $deviceSelected && !$hasPayment && !$hasSubscription => 'Ready',

            // ===== AUTO SURVEY FLOW =====
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
     * Get payment status label.
     * Simplified to only "Paid" or "Pending" for all cases.
     *
     * @param int $paymentStatus Payment status value
     * @return string Human-readable payment status label
     */
    protected function getPaymentStatusLabel(int $paymentStatus): string
    {
        // Simple: if paid status, show "Paid", otherwise "Pending"
        return $paymentStatus === \App\Models\Payment::STATUS_PAID ? 'Paid' : 'Pending';
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

    /**
     * Update device selection for a completed manual survey.
     * Creates/updates payment with subscription fee + device fee.
     * After this, customer can proceed to payment and subscription (same as auto survey).
     */
    public function updateDevice(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'customer_survey_order_id' => 'required|string',
                'with_device' => 'required|boolean',
                'device_id' => 'nullable|string',
                'device_voice_id' => 'nullable|string',
            ]);

            $surveyOrderId = $request->input('customer_survey_order_id');
            $withDevice = $request->input('with_device');
            $deviceId = $request->input('device_id');
            $deviceVoiceId = $request->input('device_voice_id');

            // Find the survey order with full model for fee calculation
            $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();

            if (!$surveyOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey order not found.',
                ], Response::HTTP_NOT_FOUND);
            }

            // Verify it's a completed manual survey
            // Cast status to int for proper comparison (status column may be string from DB)
            $currentStatus = (int) $surveyOrder->status;
            if ($currentStatus !== FFDServiceProvisionStatus::Completed->value) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device selection is only available for completed surveys.',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Prevent device selection if already selected
            if ($surveyOrder->with_device !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device has already been selected for this order.',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Check if already paid - cannot change device after payment
            $existingPayment = DB::table('payments')
                ->where('customer_survey_order_id', $surveyOrderId)
                ->first();
            if ($existingPayment && !empty($existingPayment->trans_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot change device selection after payment.',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Update device selection on survey order
            $surveyOrder->update([
                'with_device' => $withDevice,
                'device_id' => $withDevice ? $deviceId : null,
                'device_voice_id' => $withDevice ? $deviceVoiceId : null,
            ]);

            // Calculate device fee
            $deviceFee = 0;
            if ($withDevice) {
                $mainOfferId = (int) $surveyOrder->main_offer_id;
                $isCombo = $mainOfferId === 180427974;
                $isVoiceOnly = $mainOfferId === 1207609454;

                if ($isCombo) {
                    // Combo: device_id is internet, device_voice_id is voice
                    if ($deviceId) {
                        $internetDevice = \App\Models\AvailableDevice::find($deviceId);
                        $deviceFee += $internetDevice ? (float) $internetDevice->price : 0;
                    }
                    if ($deviceVoiceId) {
                        $voiceDevice = \App\Models\AvailableDevice::find($deviceVoiceId);
                        $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
                    }
                } elseif ($isVoiceOnly) {
                    // Voice only: device_id contains voice device
                    if ($deviceId) {
                        $voiceDevice = \App\Models\AvailableDevice::find($deviceId);
                        $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
                    }
                } else {
                    // Broadband: device_id contains internet device
                    if ($deviceId) {
                        $internetDevice = \App\Models\AvailableDevice::find($deviceId);
                        $deviceFee += $internetDevice ? (float) $internetDevice->price : 0;
                    }
                }
            }

            // Calculate subscription fee using PaymentCalculatorService
            // Manual surveys use calculateFeesWithoutCable (no cable charge for manual surveys)
            $paymentCalculator = app(\App\Services\Payment\PaymentCalculatorService::class);
            $fees = $paymentCalculator->calculateFeesWithoutCable($surveyOrder);
            $subscriptionFee = (float) $fees['subscription_fee'];
            $cableCharge = 0; // Manual surveys don't have cable charge

            // Total amount = subscription fee + device fee
            $totalAmount = $subscriptionFee + $cableCharge + $deviceFee;

            // Create or update payment record
            // This follows the same pattern as auto surveys
            $customer = auth()->guard('api')->user();
            $customerCode = $customer ? $customer->customer_code : $surveyOrder->customer_code;

            DB::table('payments')->updateOrInsert(
                ['customer_survey_order_id' => $surveyOrderId],
                [
                    'customer_code' => $customerCode,
                    'subscription_fee' => $subscriptionFee,
                    'cable_charge' => $cableCharge,
                    'device_fee' => $deviceFee,
                    'total_amount' => $totalAmount,
                    'status' => \App\Models\Payment::STATUS_PENDING,
                    'updated_at' => now(),
                    'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                ]
            );

            AppLogger::business()->info('Device selection and payment created for manual survey', [
                'customer_survey_order_id' => $surveyOrderId,
                'with_device' => $withDevice,
                'device_id' => $deviceId,
                'device_voice_id' => $deviceVoiceId,
                'subscription_fee' => $subscriptionFee,
                'device_fee' => $deviceFee,
                'total_amount' => $totalAmount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device selection saved. You can now proceed to payment.',
                'data' => [
                    'subscription_fee' => $subscriptionFee,
                    'device_fee' => $deviceFee,
                    'total_amount' => $totalAmount,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Throwable $e) {
            AppLogger::business()->error('Failed to update device selection', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update device selection. Please try again.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
