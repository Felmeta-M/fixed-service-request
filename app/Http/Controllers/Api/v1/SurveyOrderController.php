<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Enums\OfferId;
use App\Helpers\BandwidthHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\ManualSurveyOrderRequest;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Models\AvailableDevice;
use App\Models\Customer;
use App\Models\SurveyOrder;
use App\Services\Payment\DeviceFeeCalculatorService;
use App\Services\Survey\Manual\ManualSurveyServiceFactory;
use App\Services\QueryPurchasedOfferingService;
use App\Services\QuerySurveyOrderService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\Logging\AppLogger;
use App\Services\Survey\SurveyServiceFactory;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use InvalidArgumentException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;
use App\Services\ZoneService;
use App\Services\EcafService;
use App\Services\DeviceStockService;
use App\Support\CustomerContext;

class SurveyOrderController extends Controller
{
    public function __construct(
        protected SurveyServiceFactory $factory,
        protected readonly QuerySurveyOrderService $querySurveyOrderService,
        protected readonly QuerySubscriptionOrderStatusService $querySubscriptionOrderStatusService,
        protected readonly QueryPurchasedOfferingService $queryPurchasedOfferingService,
        protected readonly ManualSurveyServiceFactory $manualSurveyServiceFactory,
        protected readonly DeviceFeeCalculatorService $deviceFeeCalculator,
        protected readonly EcafService $ecafService,
        protected readonly DeviceStockService $deviceStockService,
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
                    'survey_orders.voice_service_number',
                    'survey_orders.data_service_number',
                    'survey_orders.bandwidth',
                    'survey_orders.cable_length',
                    'survey_orders.cable_type',
                    'survey_orders.other_related_cost',
                    'survey_orders.media_type',
                    'survey_orders.line_indicator',
                    'survey_orders.survey_failure_reason',
                    'survey_orders.with_device',
                    'survey_orders.device_id',
                    'survey_orders.device_voice_id',
                    'survey_orders.last_checked_at',
                    'survey_orders.created_at',
                    'survey_orders.updated_at',
                    'payments.id as payment_id',
                    'payments.subscription_fee as payment_subscription_fee',
                    'payments.device_fee as payment_device_fee',
                    'payments.cable_charge as payment_cable_charge',
                    'payments.other_related_cost as payment_other_related_cost',
                    'payments.total_amount as payment_total_amount',
                    'payments.status as payment_status',
                    'payments.trans_id as payment_trans_id',
                    'payments.merch_order_id as payment_merch_order_id',
                    'payments.payment_order_id as payment_payment_order_id',
                ]);

            // Handle search parameter - search in order IDs, voice_service_number, and data_service_number
            if ($request->filled('search')) {
                $searchTerm = $request->input('search');
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('survey_orders.customer_survey_order_id', 'like', '%' . $searchTerm . '%')
                        ->orWhere('survey_orders.customer_subscription_order_id', 'like', '%' . $searchTerm . '%')
                        ->orWhere('survey_orders.voice_service_number', 'like', '%' . $searchTerm . '%')
                        ->orWhere('survey_orders.data_service_number', 'like', '%' . $searchTerm . '%');
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

            $freshRows = collect(); // Re-fetched rows after batch refresh so list shows synced data
            if ($ordersToRefresh->isNotEmpty()) {
                $this->batchRefreshOrders($ordersToRefresh);
                // Re-fetch refreshed orders so the list response shows synced data (status, survey result)
                $refreshedIds = $ordersToRefresh->pluck('id')->all();
                $freshRows = DB::table('survey_orders')
                    ->leftJoin('payments', 'survey_orders.customer_survey_order_id', '=', 'payments.customer_survey_order_id')
                    ->whereIn('survey_orders.id', $refreshedIds)
                    ->select([
                        'survey_orders.id',
                        'survey_orders.customer_survey_order_id',
                        'survey_orders.customer_subscription_order_id',
                        'survey_orders.survey_is_manual',
                        'survey_orders.survey_type',
                        'survey_orders.customer_code',
                        'survey_orders.status',
                        'survey_orders.main_offer_id',
                        'survey_orders.voice_service_number',
                        'survey_orders.data_service_number',
                        'survey_orders.bandwidth',
                        'survey_orders.cable_length',
                        'survey_orders.cable_type',
                        'survey_orders.other_related_cost',
                        'survey_orders.media_type',
                        'survey_orders.line_indicator',
                        'survey_orders.survey_failure_reason',
                        'survey_orders.with_device',
                        'survey_orders.device_id',
                        'survey_orders.device_voice_id',
                        'survey_orders.last_checked_at',
                        'survey_orders.created_at',
                        'survey_orders.updated_at',
                        'payments.id as payment_id',
                        'payments.subscription_fee as payment_subscription_fee',
                        'payments.device_fee as payment_device_fee',
                        'payments.cable_charge as payment_cable_charge',
                        'payments.other_related_cost as payment_other_related_cost',
                        'payments.total_amount as payment_total_amount',
                        'payments.status as payment_status',
                        'payments.trans_id as payment_trans_id',
                        'payments.merch_order_id as payment_merch_order_id',
                        'payments.payment_order_id as payment_payment_order_id',
                    ])
                    ->get()
                    ->keyBy('id');
            }

            // Use fresh data for refreshed orders so sync is visible in the list response
            $transformedItems = collect($surveyOrders->items())->map(function ($item) use ($freshRows) {
                $row = $freshRows->has($item->id) ? $freshRows->get($item->id) : $item;
                return $this->transformOrder($row);
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
        $surveyResultUpdates = []; // For manual survey result fields
        $timestampUpdates = [];
        $manualSurveyCompletedNotifications = []; // Track manual surveys that completed for SMS notifications
        $manualSurveyFailedNotifications = []; // Track manual surveys that failed for SMS notifications
        $ecafUploads = []; // Track orders that transition to Completed for ECAF upload

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
                    // Close updates: once manual survey is Completed we do not re-query BSS or overwrite survey result.
                    // All required attributes were persisted once on success; customer continues with device selection (by cable type) → payment → activate.
                    if ((int) $order->status === FFDServiceProvisionStatus::Completed->value) {
                        $timestampUpdates[] = $order->id;
                        continue;
                    }

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
                    // survey_result keys are LOCAL attribute names; BSS sends param CODES.
                    // Mapping: QuerySurveyOrderService::BSS_SURVEY_PARAM_TO_ATTRIBUTE (e.g. 50005→media_type, 2147→cable_length, 1924→other_related_cost).
                    $surveyResult = $response['survey_result'];

                    if (!empty($surveyResult['survey_failed'])) {
                        // Survey FAILED (50005 = -1)
                        // Override status to Failed and save failure reason
                        $statusUpdates[$order->id] = FFDServiceProvisionStatus::Failed->value;
                        $surveyResultUpdates[$order->id] = [
                            'media_type' => null, // BSS param 50005
                            'cable_type' => null, // BSS param 50056
                            'line_indicator' => null, // BSS param 50112
                            'survey_failure_reason' => $surveyResult['survey_failure_reason'] ?? 'Survey failed',
                            'zone_code' => null, // Clear zone code on failure
                            'cable_length' => null, // BSS param 2147
                            'other_related_cost' => null, // BSS param 1924
                        ];

                        // Queue notification for manual survey failure
                        // Only notify if status is actually changing to Failed
                        if ($order->status !== FFDServiceProvisionStatus::Failed->value) {
                            $manualSurveyFailedNotifications[] = [
                                'phone' => $order->contact_no ?? null,
                                'customer_name' => $order->contact_person ?? 'Customer',
                                'service_type' => $order->main_offer_id,
                                'order_number' => $order->customer_survey_order_id,
                                'failure_reason' => $surveyResult['survey_failure_reason'] ?? null,
                            ];
                        }
                    } else {
                        // Survey COMPLETED (BSS 50005 = PON/COPPER). Values below are local names; BSS sends code numbers.
                        // Required: media_type (50005), cable_type (50056), line_indicator (50112)
                        $mediaType = $surveyResult['media_type'] ?? null;
                        $cableType = $surveyResult['cable_type'] ?? null;
                        $lineIndicator = $surveyResult['line_indicator'] ?? null;
                        $cableLength = $surveyResult['cable_length'] ?? null;       // BSS 2147
                        $otherRelatedCost = $surveyResult['other_related_cost'] ?? null; // BSS 1924
                        $zoneName = $surveyResult['zone_name'] ?? null;             // BSS 50001 → lookup zone_code

                        // Lookup zone code from zone name (parameter 50001 from BSS survey response)
                        // The BSS returns zone name like "CAAZ" (Central Addis Ababa Zone), we lookup the code in ethio_zones table
                        $zoneCode = null;
                        if ($zoneName) {
                            try {
                                // Use ZoneService - single source of truth
                                $ethioZone = app(ZoneService::class)->getEthioZoneByName($zoneName);

                                if ($ethioZone) {
                                    $zoneCode = $ethioZone->code;
                                    AppLogger::business()->info('Zone code found for manual survey', [
                                        'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                                        'zone_name' => $zoneName, // From BSS parameter 50001 (e.g., "CAAZ")
                                        'zone_code' => $zoneCode, // Looked up from ethio_zones table
                                    ]);
                                } else {
                                    AppLogger::business()->warning('Ethio zone not found by name', [
                                        'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                                        'zone_name' => $zoneName, // From BSS parameter 50001
                                    ]);
                                }
                            } catch (Throwable $e) {
                                AppLogger::business()->warning('Failed to lookup zone code', [
                                    'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                                    'zone_name' => $zoneName, // From BSS parameter 50001
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        }

                        // Check if all required survey result fields have values
                        $hasAllRequiredFields = (
                            $mediaType !== null &&
                            $cableType !== null &&
                            $lineIndicator !== null
                        );

                        if ($hasAllRequiredFields) {
                            // Success: persist ALL required attributes once, then close survey result updates (no further BSS overwrite).
                            // Customer flow: device selection (filtered by cable type) → payment → activate service.
                            $statusUpdates[$order->id] = FFDServiceProvisionStatus::Completed->value;

                            // Persist all required attributes (BSS codes already mapped by QuerySurveyOrderService)
                            $surveyResultData = [
                                'media_type' => $mediaType,
                                'cable_type' => $cableType,
                                'line_indicator' => $lineIndicator,
                                'cable_length' => $cableLength,
                                'other_related_cost' => $otherRelatedCost,
                                'survey_failure_reason' => null,
                                'zone_code' => $zoneCode,
                            ];

                            // STRICT: Never touch device fields if device is already selected
                            // Device fields are managed exclusively by update-device endpoint
                            $deviceAlreadySelected = $order->with_device !== null;

                            // Only reset device selection when:
                            // 1. Status is FIRST changing to Completed, AND
                            // 2. Device has NOT been selected yet
                            if ($order->status !== FFDServiceProvisionStatus::Completed->value && !$deviceAlreadySelected) {
                                $surveyResultData['with_device'] = null;
                                $surveyResultData['device_id'] = null;
                                $surveyResultData['device_voice_id'] = null;

                                // Queue notification for manual survey completion
                                $manualSurveyCompletedNotifications[] = [
                                    'phone' => $order->contact_no ?? null,
                                    'customer_name' => $order->contact_person ?? 'Customer',
                                    'service_type' => $order->main_offer_id,
                                    'order_number' => $order->customer_survey_order_id,
                                ];
                            }

                            $surveyResultUpdates[$order->id] = $surveyResultData;
                        } else {
                            // Do not persist: we only save survey result when ALL required attributes are present (success).
                            // Only update status to Waiting until BSS returns full survey result.
                            $newStatus = (int) $response['status'];
                            if ($newStatus >= 1 && $newStatus <= 8) {
                                $statusUpdates[$order->id] = FFDServiceProvisionStatus::Waiting->value;
                            }
                        }
                    }
                } else {
                    // Non-manual surveys (auto surveys) or no survey_result: use BSS status directly
                    // Only accept valid status codes (1-8 matching FFDServiceProvisionStatus enum)
                    $newStatus = (int) $response['status'];
                    if ($newStatus >= 1 && $newStatus <= 8) {
                        $statusUpdates[$order->id] = $newStatus;

                        // Track subscription orders that transition TO Completed for ECAF upload
                        if (
                            $newStatus === FFDServiceProvisionStatus::Completed->value &&
                            (int) $order->status !== FFDServiceProvisionStatus::Completed->value &&
                            !empty($order->transaction_id)
                        ) {
                            $ecafUploads[] = [
                                'survey_order_id' => $order->customer_survey_order_id,
                                'transaction_id' => $order->transaction_id,
                                'customer_code' => $order->customer_code,
                            ];
                        }
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
        // All allowed columns are persisted so media_type, cable_type, line_indicator, cable_length, other_related_cost, zone_code, etc. are saved
        $allowedSurveyResultColumns = [
            'media_type',
            'cable_type',
            'line_indicator',
            'cable_length',
            'other_related_cost',
            'survey_failure_reason',
            // 'zone_code',
            'with_device',
            'device_id',
            'device_voice_id',
            'updated_at',
        ];
        foreach ($surveyResultUpdates as $orderId => $fields) {
            if (!empty($fields)) {
                $fields['updated_at'] = now();
                $payload = array_intersect_key($fields, array_flip($allowedSurveyResultColumns));
                if (!empty($payload)) {
                    SurveyOrder::where('id', $orderId)->update($payload);
                }
            }
        }

        // Batch update timestamps - ensure unique IDs
        if (!empty($timestampUpdates)) {
            $uniqueIds = array_unique($timestampUpdates);
            DB::table('survey_orders')
                ->whereIn('id', $uniqueIds)
                ->update(['last_checked_at' => now()]);
        }

        // Send SMS notifications for completed manual surveys (non-blocking)
        foreach ($manualSurveyCompletedNotifications as $notification) {
            if (!empty($notification['phone'])) {
                try {
                    \App\Services\NotificationService::sendSurveyCreated(
                        $notification['phone'],
                        $notification['customer_name'],
                        $this->mapOfferIdToServiceType($notification['service_type']),
                        $notification['order_number']
                    );
                } catch (Throwable $e) {
                    AppLogger::business()->warning('Failed to send manual survey completion SMS', [
                        'order_number' => $notification['order_number'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        // Send SMS notifications for failed manual surveys (non-blocking)
        foreach ($manualSurveyFailedNotifications as $notification) {
            if (!empty($notification['phone'])) {
                try {
                    \App\Services\NotificationService::sendSurveyFailed(
                        $notification['phone'],
                        $notification['customer_name'],
                        $this->mapOfferIdToServiceType($notification['service_type']),
                        $notification['order_number'],
                        $notification['failure_reason']
                    );
                } catch (Throwable $e) {
                    AppLogger::business()->warning('Failed to send manual survey failure SMS', [
                        'order_number' => $notification['order_number'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        // Upload ECAF documents for orders that transitioned to Completed (non-blocking)
        foreach ($ecafUploads as $ecafData) {
            try {
                $this->uploadEcafForOrder($ecafData);
            } catch (Throwable $e) {
                AppLogger::api()->warning('ECAF upload failed during status refresh', [
                    'survey_order_id' => $ecafData['survey_order_id'],
                    'transaction_id' => $ecafData['transaction_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Upload ECAF document for a completed subscription order.
     * Gets customer photo from the customer table and uploads to ECAF service.
     */
    protected function uploadEcafForOrder(array $ecafData): void
    {
        $customerCode = $ecafData['customer_code'];
        $transactionId = $ecafData['transaction_id'];
        $surveyOrderId = $ecafData['survey_order_id'];

        // Get customer photo
        $customer = DB::table('customers')
            ->where('code', $customerCode)
            ->whereNull('deleted_at')
            ->select('picture')
            ->first();

        if (!$customer || empty($customer->picture)) {
            AppLogger::api()->warning('ECAF upload skipped: customer photo not available', [
                'survey_order_id' => $surveyOrderId,
                'customer_code' => $customerCode,
            ]);
            return;
        }

        // Upload ECAF document
        $response = $this->ecafService->uploadFile([
            'transaction_id' => $transactionId,
            'photo' => $customer->picture,
        ]);

        if ($response['success'] ?? false) {
            AppLogger::api()->info('ECAF document uploaded successfully', [
                'survey_order_id' => $surveyOrderId,
                'transaction_id' => $transactionId,
            ]);
        } else {
            AppLogger::api()->warning('ECAF document upload returned error', [
                'survey_order_id' => $surveyOrderId,
                'transaction_id' => $transactionId,
                'response' => $response,
            ]);
        }
    }

    /**
     * Map main_offer_id to service type label for notifications.
     */
    protected function mapOfferIdToServiceType(mixed $offerId): string
    {
        return match ((int) $offerId) {
            1 => 'voice',
            2 => 'data',
            3 => 'combo',
            default => 'voice', // Default to voice if unknown
        };
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

            // Get customer code from authenticated user or context
            $customerCode = $this->getCustomerCode($customer, $data);

            if (!$customerCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer code is required.',
                ], 422);
            }

            // Validate bandwidth is provided (required for all survey orders)
            $bandwidth = $data['bandwidth'] ?? null;
            if (empty($bandwidth)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bandwidth is required for survey orders. Please select a bandwidth option.',
                    'errors' => ['bandwidth' => ['Bandwidth is required for survey orders.']],
                ], 422);
            }

            // Validate: (1) no existing order with customer_subscription_order_id null for same customer/offer/type;
            // (2) no duplicate by customer_code, main_offer_id, survey_type
            $mainOfferId = (int) ($data['main_offer_id'] ?? 0);
            $surveyType = $data['survey_type'] ?? 'EIC08';

            $duplicateValidation = SurveyOrder::validateDuplicate(
                $customerCode,
                $mainOfferId,
                $surveyType
            );

            // if ($duplicateValidation) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => $duplicateValidation['message'],
            //     ], Response::HTTP_CONFLICT);
            // }

            // For manual surveys, route by main_offer_id to Data / Voice / Combo manual service.
            // Use server-side values for security: customer_code from auth, survey_type/oper_type from config.
            if (!empty($data['survey_is_manual'])) {
                $mainOfferId = (int) $data['main_offer_id'];
                $data['customer_code'] = $customerCode;
                $data['survey_type'] = $data['survey_type'] ?? 'EIC08';
                $data['oper_type'] = $data['oper_type'] ?? 'A';
                return $this->manualSurveyServiceFactory->make($mainOfferId)->createSurveyOrder($data);
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
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Throwable $e) {
            AppLogger::business()->error('SurveyOrder store error', [
                'error' => $e->getMessage(),
            ]);

            return \App\Services\ApiResponse::safeError(
                $e,
                'Failed to create service request. Please try again later.'
            );
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

        // Fetch survey order with payment data (using Query Builder for performance with joins)
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
     * Explicitly select current survey_orders columns (voice_service_number, data_service_number)
     * so we never select dropped columns (service_number, fbb_service_number) and ensure new attributes are from DB.
     */
    protected function fetchSurveyOrder(?string $subscriptionOrderId, ?string $surveyOrderId): ?object
    {
        $surveyOrderColumns = [
            'survey_orders.id',
            'survey_orders.customer_id',
            'survey_orders.customer_code',
            'survey_orders.customer_survey_order_id',
            'survey_orders.customer_subscription_order_id',
            'survey_orders.main_offer_id',
            'survey_orders.voice_service_number',
            'survey_orders.data_service_number',
            'survey_orders.internet_account',
            'survey_orders.internet_password',
            'survey_orders.survey_type',
            'survey_orders.telecom_region',
            'survey_orders.area_code',
            'survey_orders.area_name',
            'survey_orders.oper_type',
            'survey_orders.customer_type',
            'survey_orders.bandwidth',
            'survey_orders.contact_person',
            'survey_orders.contact_no',
            'survey_orders.contact_email',
            'survey_orders.sec_contact_person',
            'survey_orders.sec_contact_no',
            'survey_orders.sec_contact_email',
            'survey_orders.status',
            'survey_orders.cancel_reason',
            'survey_orders.completed_date',
            'survey_orders.subscribed_at',
            'survey_orders.cable_length',
            'survey_orders.cable_type',
            'survey_orders.cable_charge',
            'survey_orders.other_related_cost',
            'survey_orders.media_type',
            'survey_orders.line_indicator',
            'survey_orders.survey_failure_reason',
            'survey_orders.lat',
            'survey_orders.long',
            'survey_orders.with_device',
            'survey_orders.device_id',
            'survey_orders.device_voice_id',
            'survey_orders.device_offer_id',
            'survey_orders.device_voice_offer_id',
            'survey_orders.survey_is_manual',
            'survey_orders.zone_code',
            'survey_orders.last_checked_at',
            'survey_orders.last_synced_status',
            'survey_orders.created_at',
            'survey_orders.updated_at',
            'survey_orders.deleted_at',
        ];

        // Use Query Builder for performance (joins with payments)
        $query = DB::table('survey_orders')
            ->leftJoin('payments', 'survey_orders.customer_survey_order_id', '=', 'payments.customer_survey_order_id')
            ->whereNull('survey_orders.deleted_at')
            ->select(array_merge($surveyOrderColumns, [
                'payments.id as payment_id',
                'payments.subscription_fee as payment_subscription_fee',
                'payments.device_fee as payment_device_fee',
                'payments.cable_charge as payment_cable_charge',
                'payments.other_related_cost as payment_other_related_cost',
                'payments.total_amount as payment_total_amount',
                'payments.status as payment_status',
                'payments.payment_order_id as payment_payment_order_id',
                'payments.merch_order_id as payment_merch_order_id',
                'payments.trans_id as payment_trans_id',
            ]));

        // Apply order ID filter
        if ($subscriptionOrderId) {
            $query->where('survey_orders.customer_subscription_order_id', (string) $subscriptionOrderId);
        } elseif ($surveyOrderId) {
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
        // Only for completed orders with subscription and a service number
        if ((int) $order->status !== FFDServiceProvisionStatus::Completed->value) {
            return false;
        }

        $primaryNumber = $order->data_service_number ?? $order->voice_service_number ?? null;
        if (empty($order->customer_subscription_order_id) || empty($primaryNumber)) {
            return false;
        }

        try {
            // Query current purchased offering (Combo: data line; Voice/Data: single line)
            $response = $this->queryPurchasedOfferingService
                ->queryByServiceNumber($primaryNumber);

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
     * Cable length chargeable (meters over 500). Customer pays only for length > 500; first 500 m are free.
     * Used for payment summary display (e.g. "Cable (X m over 500 m): Y birr").
     */
    protected function cableLengthChargeable($cableLength): ?float
    {
        if ($cableLength === null || $cableLength === '') {
            return null;
        }
        $length = (float) $cableLength;
        return $length <= 500 ? 0.0 : round($length - 500, 2);
    }

    /**
     * Build device line items for payment summary (each device with name and price).
     *
     * @return array{device_items: array<int, array{name: string, price: float, type: string}>}
     */
    protected function buildPaymentDeviceItems(object $order): array
    {
        $items = [];
        $mainOfferId = (int) ($order->main_offer_id ?? 0);
        $offerType = OfferId::tryFromInt($mainOfferId);

        if ($offerType?->isCombo()) {
            if (!empty($order->device_id)) {
                $device = AvailableDevice::find($order->device_id);
                if ($device) {
                    $items[] = [
                        'name' => $device->item_name ?? $device->name ?? 'Internet Device',
                        'price' => (float) $device->price,
                        'type' => 'data',
                    ];
                }
            }
            if (!empty($order->device_voice_id)) {
                $device = AvailableDevice::find($order->device_voice_id);
                if ($device) {
                    $items[] = [
                        'name' => $device->item_name ?? $device->name ?? 'Voice Device',
                        'price' => (float) $device->price,
                        'type' => 'voice',
                    ];
                }
            }
        } elseif ($offerType?->isVoiceOnly()) {
            if (!empty($order->device_voice_id)) {
                $device = AvailableDevice::find($order->device_voice_id);
                if ($device) {
                    $items[] = [
                        'name' => $device->item_name ?? $device->name ?? 'Voice Device',
                        'price' => (float) $device->price,
                        'type' => 'voice',
                    ];
                }
            }
            if (empty($items) && !empty($order->device_id)) {
                $device = AvailableDevice::find($order->device_id);
                if ($device) {
                    $items[] = [
                        'name' => $device->item_name ?? $device->name ?? 'Voice Device',
                        'price' => (float) $device->price,
                        'type' => 'voice',
                    ];
                }
            }
        } else {
            if (!empty($order->device_id)) {
                $device = AvailableDevice::find($order->device_id);
                if ($device) {
                    $items[] = [
                        'name' => $device->item_name ?? $device->name ?? 'Device',
                        'price' => (float) $device->price,
                        'type' => 'data',
                    ];
                }
            }
        }

        return ['device_items' => $items];
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
            'customer' => $this->buildCustomerInfo($order->customer_code ?? null),
            'main_offer_id' => $order->main_offer_id,
            'voice_service_number' => $order->voice_service_number ?? null,
            'data_service_number' => $order->data_service_number ?? null,
            'device' => $this->buildDeviceInfo($order->device_id ?? null),
            'voice_device' => $this->buildDeviceInfo($order->device_voice_id ?? null),
            // Internet credentials for device configuration (Data and Combo services)
            'internet_account' => $order->internet_account ?? null,
            'internet_password' => $order->internet_password ?? null,
            // Backend is single source of truth - return formatted for display
            'bandwidth' => BandwidthHelper::format($order->bandwidth),
            'bandwidth_raw' => $order->bandwidth ?? null, // Raw KB value for debugging/API use
            'cable_length' => $order->cable_length ?? null,   // BSS param 2147 (total meters)
            'cable_length_chargeable' => $this->cableLengthChargeable($order->cable_length), // Meters over 500; customer pays only for this
            'cable_type' => $order->cable_type ?? null, // BSS param 50056: 0=copper, 1=fiber, 2=EPON, 3=GPON, 5=without survey
            'other_related_cost' => $order->other_related_cost ?? null, // BSS param 1924 (labour/material)
            'media_type' => $order->media_type ?? null, // BSS param 50005: PON (fiber) or COPPER, null if failed
            'line_indicator' => $order->line_indicator ?? null, // BSS param 50112: 0=same line, 1=separate line
            'survey_failure_reason' => $order->survey_failure_reason ?? null, // Reason when survey failed (50005 = -1)
            'survey_is_manual' => $isManualSurvey,
            'with_device' => $withDevice,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'payment' => $paymentId ? array_merge(
                [
                    'subscription_fee' => (float) ($order->payment_subscription_fee ?? 0),
                    'device_fee' => (float) ($order->payment_device_fee ?? 0),
                    'cable_charge' => (float) ($order->payment_cable_charge ?? 0),
                    'other_related_cost' => (float) ($order->payment_other_related_cost ?? 0), // labour/material
                    'total_amount' => (float) ($order->payment_total_amount ?? 0),
                    'merch_order_id' => $order->payment_merch_order_id ?? null,
                    'status' => $this->getPaymentStatusLabel($paymentStatus),
                ],
                $this->buildPaymentDeviceItems($order)
            ) : null,
            'status_code' => $this->getStatusCode($order),  // Stable code for frontend logic
            'status' => $this->getStatusLabel($order),       // Display label (frontend can override)
            'is_paid' => SurveyOrder::checkIsPaid($paymentStatus, $paymentTransId),
            // Action permissions - single source of truth from model
            'can_continue' => SurveyOrder::checkCanContinue(
                $status,
                $isManualSurvey,
                $withDevice,
                $subscriptionOrderId,
                $surveyFailureReason,
                $order->media_type ?? null
            ),
            'can_pay' => SurveyOrder::checkCanPay($status, $paymentAmount, $paymentTransId, $subscriptionOrderId, $isManualSurvey, $withDevice),
            'can_subscribe' => SurveyOrder::checkCanSubscribe($status, $paymentAmount, $paymentTransId, $subscriptionOrderId, $isManualSurvey, $withDevice),
            'can_change_offer' => SurveyOrder::checkCanChangeOffer($status, $subscriptionOrderId),
            'can_cancel' => SurveyOrder::checkCanCancel($status, $subscriptionOrderId, $paymentTransId),
            'can_terminate' => SurveyOrder::checkCanTerminate($status, $subscriptionOrderId),
        ];
    }

    /**
     * Get customer code from authenticated user or request data.
     * 
     * @param mixed $customer Authenticated user
     * @param array $data Request data
     * @return string|null Customer code or null if not found
     */
    protected function getCustomerCode($customer, array $data): ?string
    {
        return CustomerContext::code()
            ?? $customer?->customer_code
            ?? $data['customer_code']
            ?? null;
    }

    /**
     * Build customer info for survey order resource (cached per request to avoid N+1).
     */
    protected function buildCustomerInfo(?string $customerCode): ?array
    {
        if (empty($customerCode)) {
            return null;
        }

        static $cache = [];
        if (!isset($cache[$customerCode])) {
            $customer = Customer::where('code', $customerCode)->first();
            $cache[$customerCode] = $customer ? [
                'code' => $customer->code,
                'name' => $customer->name ?? null,
                'phone_number' => $customer->phone_number ?? null,
            ] : null;
        }

        return $cache[$customerCode];
    }

    /**
     * Build device info for survey order resource (cached per request to avoid N+1).
     */
    protected function buildDeviceInfo(?string $deviceId): ?array
    {
        if (empty($deviceId)) {
            return null;
        }

        static $cache = [];
        if (!isset($cache[$deviceId])) {
            $device = AvailableDevice::find($deviceId);
            $cache[$deviceId] = $device ? [
                'id' => $device->id,
                'name' => $device->name ?? null,
                'vendor' => $device->vendor ?? null,
                'model' => $device->model ?? null,
                'price' => $device->price !== null ? (float) $device->price : null,
                'device_type' => $device->device_type ?? null,
                'media_type' => $device->media_type ?? null,
            ] : null;
        }

        return $cache[$deviceId];
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
     * Get stable status code for frontend logic (decoupled from display labels).
     * Frontend uses this code for logic/filtering; display labels are defined in frontend.
     *
     * @param object $order Order data from database
     * @return string Stable status code (snake_case, never changes)
     */
    protected function getStatusCode(object $order): string
    {
        $statusEnum = FFDServiceProvisionStatus::tryFrom((int) ($order->status ?? 0));
        $hasSubscription = !empty($order->customer_subscription_order_id);
        $paymentAmount = (float) ($order->payment_total_amount ?? 0);
        $paymentTransId = $order->payment_trans_id ?? null;
        $isPaid = !empty($paymentTransId);
        $hasPayment = $paymentAmount > 0;

        $rawManual = $order->survey_is_manual ?? false;
        $isManual = $rawManual === true || $rawManual === 't' || $rawManual === 1 || $rawManual === '1';

        $rawWithDevice = $order->with_device ?? null;
        $deviceSelected = $rawWithDevice !== null;

        $manualInProgress = in_array($statusEnum, [
            FFDServiceProvisionStatus::Created,
            FFDServiceProvisionStatus::Waiting,
            FFDServiceProvisionStatus::Processing,
        ], true);

        return match (true) {
            // Failed/Cancelled
            $statusEnum === FFDServiceProvisionStatus::Failed => 'failed',
            $statusEnum === FFDServiceProvisionStatus::Cancelled => 'cancelled',

            // Phase 2: Subscription phase
            $statusEnum === FFDServiceProvisionStatus::Waiting && $hasSubscription => 'order_waiting',
            $statusEnum === FFDServiceProvisionStatus::Completed && $hasSubscription => 'order_completed',

            // Manual flow
            $isManual && $manualInProgress && !$hasSubscription => 'waiting',
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && !$deviceSelected && !$hasSubscription => 'device_selection',
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && $deviceSelected && $hasPayment && !$isPaid && !$hasSubscription => 'pending_payment',
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && $deviceSelected && $isPaid && !$hasSubscription => 'paid',
            $isManual && $statusEnum === FFDServiceProvisionStatus::Completed && $deviceSelected && !$hasPayment && !$hasSubscription => 'ready',

            // Auto flow
            $statusEnum === FFDServiceProvisionStatus::Waiting && !$hasSubscription && $isPaid => 'paid',
            $statusEnum === FFDServiceProvisionStatus::Waiting && !$hasSubscription => 'waiting_assessment',
            $statusEnum === FFDServiceProvisionStatus::Completed && !$hasSubscription && $hasPayment && !$isPaid => 'pending_payment',
            $statusEnum === FFDServiceProvisionStatus::Completed && !$hasSubscription => 'assessment_complete',

            // Default
            default => 'processing',
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

            $customerCode = CustomerContext::code();
            if (!$customerCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer code is required.',
                ], 422);
            }

            $data['customer_code'] = $customerCode;
            $data['survey_type'] = $data['survey_type'] ?? 'EIC08';
            $data['oper_type'] = $data['oper_type'] ?? 'A';

            // Check for existing active survey orders for this customer
            // if (SurveyOrder::hasBlockedSurvey($customerCode)) {
            //     AppLogger::business()->warning('Manual survey blocked - existing active order', [
            //         'customer_code' => $customerCode,
            //     ]);

            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Customer already has an active survey order.',
            //     ], Response::HTTP_CONFLICT);
            // }

            // Create the manual survey order via BSS (Fixed Data or Fixed Voice)
            $result = $this->manualSurveyServiceFactory
                ->make((int) $data['main_offer_id'])
                ->createSurveyOrder($data);

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
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
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

            // Prevent device re-selection if already selected (first selection only)
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

            // Validate stock availability before allowing device selection
            if ($withDevice) {
                try {
                    $this->deviceStockService->validateStock($deviceId, $deviceVoiceId);
                } catch (\RuntimeException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                    ], Response::HTTP_BAD_REQUEST);
                }
            }

            // Get device offer_id from the selected device (data device)
            $deviceOfferId = null;
            if ($withDevice && $deviceId) {
                $device = \App\Models\AvailableDevice::find($deviceId);
                $deviceOfferId = $device?->offer_id;
            }

            // Get device_voice_offer_id for combo (voice device)
            $deviceVoiceOfferId = null;
            if ($withDevice && $deviceVoiceId) {
                $deviceVoice = \App\Models\AvailableDevice::find($deviceVoiceId);
                $deviceVoiceOfferId = $deviceVoice?->offer_id;
            }

            // Update device selection on survey order
            $surveyOrder->update([
                'with_device' => $withDevice,
                'device_id' => $withDevice ? $deviceId : null,
                'device_voice_id' => $withDevice ? $deviceVoiceId : null,
                'device_offer_id' => $deviceOfferId,
                'device_voice_offer_id' => $deviceVoiceOfferId,
            ]);

            // Refresh to get updated device IDs, then calculate fee using dedicated service
            $surveyOrder->refresh();
            $deviceFee = $this->deviceFeeCalculator->calculate($surveyOrder);

            // Compute fees like auto survey: subscription + cable charge (from cable_length/cable_type) + device fee + other_related_cost
            $paymentCalculator = app(\App\Services\Payment\PaymentCalculatorService::class);
            $fees = $paymentCalculator->calculateFees($surveyOrder);
            $subscriptionFee = (float) $fees['subscription_fee'];
            $cableCharge = (float) $fees['cable_charge'];
            $otherRelatedCost = (float) ($surveyOrder->other_related_cost ?? 0);

            // Total amount = subscription fee + cable charge + device fee + other_related_cost (same structure as auto survey + BSS 1924)
            $totalAmount = $subscriptionFee + $cableCharge + $deviceFee + $otherRelatedCost;

            // Create or update payment record (same pattern as auto surveys, plus other_related_cost)
            $customer = auth()->guard('api')->user();
            $customerCode = $customer ? $customer->customer_code : $surveyOrder->customer_code;

            DB::table('payments')->updateOrInsert(
                ['customer_survey_order_id' => $surveyOrderId],
                [
                    'customer_code' => $customerCode,
                    'subscription_fee' => $subscriptionFee,
                    'cable_charge' => $cableCharge,
                    'device_fee' => $deviceFee,
                    'other_related_cost' => $otherRelatedCost,
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
                'device_offer_id' => $deviceOfferId,
                'device_voice_offer_id' => $deviceVoiceOfferId,
                'subscription_fee' => $subscriptionFee,
                'cable_charge' => $cableCharge,
                'device_fee' => $deviceFee,
                'other_related_cost' => $otherRelatedCost,
                'total_amount' => $totalAmount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device selection saved. You can now proceed to payment.',
                'data' => [
                    'subscription_fee' => $subscriptionFee,
                    'cable_charge' => $cableCharge,
                    'device_fee' => $deviceFee,
                    'other_related_cost' => $otherRelatedCost,
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
