<?php

namespace App\Jobs;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use App\Services\EcafService;
use App\Services\Logging\AppLogger;
use App\Services\QuerySurveyOrderService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\ZoneService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Batch refresh survey order statuses (BSS/subscription APIs) and apply updates.
 *
 * Test with php artisan tinker:
 *
 *   // Get IDs that need refresh (e.g. WAITING), or any 1–2 IDs for testing
 *   $ids = \DB::table('survey_orders')->whereNull('deleted_at')->limit(2)->pluck('id')->all();
 *
 *   // Dispatch to queue (then run: php artisan queue:work --once)
 *   \App\Jobs\BatchRefreshSurveyOrdersJob::dispatch($ids);
 *
 *   // Or run synchronously (no worker; good for quick test)
 *   \App\Jobs\BatchRefreshSurveyOrdersJob::dispatchSync($ids);
 */
class BatchRefreshSurveyOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 2;

    /**
     * Create a new job instance.
     *
     * @param  array<int>  $orderIds  Survey order IDs to refresh
     */
    public function __construct(
        public array $orderIds
    ) {
        $this->onQueue('default');
    }

    public function handle(
        QuerySurveyOrderService $querySurveyOrderService,
        QuerySubscriptionOrderStatusService $querySubscriptionOrderStatusService,
        EcafService $ecafService
    ): void {
        if (empty($this->orderIds)) {
            AppLogger::business()->info('Batch refresh survey orders skipped: no order IDs', [
                'job' => 'BatchRefreshSurveyOrdersJob',
            ]);
            return;
        }

        AppLogger::business()->info('Batch refresh survey orders started', [
            'job' => 'BatchRefreshSurveyOrdersJob',
            'order_count' => count($this->orderIds),
            'order_ids' => $this->orderIds,
        ]);

        $orders = $this->loadOrders();
        if ($orders->isEmpty()) {
            AppLogger::business()->warning('Batch refresh survey orders: no orders loaded', [
                'job' => 'BatchRefreshSurveyOrdersJob',
                'requested_ids' => $this->orderIds,
            ]);
            return;
        }

        $statusUpdates = [];
        $surveyResultUpdates = [];
        $timestampUpdates = [];
        $manualSurveyCompletedNotifications = [];
        $manualSurveyFailedNotifications = [];
        $ecafUploads = [];

        foreach ($orders as $order) {
            try {
                $rawManual = $order->survey_is_manual ?? true;
                $isManual = $rawManual === true || $rawManual === 't' || $rawManual === 1 || $rawManual === '1';
                $response = null;

                if (! empty($order->customer_subscription_order_id)) {
                    $subscriptionResponse = $querySubscriptionOrderStatusService
                        ->queryStatus($order->customer_subscription_order_id);

                    if (! empty($subscriptionResponse['success']) && isset($subscriptionResponse['status']) && $subscriptionResponse['status'] > 0) {
                        $newStatus = (int) $subscriptionResponse['status'];
                        $response = [
                            'success' => true,
                            'status' => $newStatus,
                        ];
                    } else {
                        $response = null;
                    }
                }

                if ($isManual && empty($order->customer_subscription_order_id)) {
                    if ((int) $order->status === FFDServiceProvisionStatus::Completed->value) {
                        $timestampUpdates[] = $order->id;
                        continue;
                    }

                    $surveyResponse = $querySurveyOrderService
                        ->querySurveyOrderDetail($order->customer_survey_order_id);

                    $responseData = $surveyResponse instanceof \Illuminate\Http\JsonResponse
                        ? $surveyResponse->getData(true)
                        : $surveyResponse;

                    if (! empty($responseData['success']) && isset($responseData['data']['status'])) {
                        $response = [
                            'success' => true,
                            'status' => $responseData['data']['status'],
                            'survey_result' => $responseData['data']['survey_result'] ?? null,
                        ];
                    } elseif (! empty($responseData['success']) && isset($responseData['status'])) {
                        $response = $responseData;
                    } else {
                        $response = null;
                    }
                }

                if (empty($response['success']) || ! isset($response['status'])) {
                    $timestampUpdates[] = $order->id;
                    continue;
                }

                if ($isManual && ! empty($response['survey_result'])) {
                    $surveyResult = $response['survey_result'];

                    if (! empty($surveyResult['survey_failed'])) {
                        $statusUpdates[$order->id] = FFDServiceProvisionStatus::Failed->value;
                        $surveyResultUpdates[$order->id] = [
                            'media_type' => null,
                            'cable_type' => null,
                            'line_indicator' => null,
                            'survey_failure_reason' => $surveyResult['survey_failure_reason'] ?? 'Survey failed',
                            'zone_code' => null,
                            'cable_length' => null,
                            'other_related_cost' => null,
                        ];

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
                        $mediaType = $surveyResult['media_type'] ?? null;
                        $cableType = $surveyResult['cable_type'] ?? null;
                        $lineIndicator = $surveyResult['line_indicator'] ?? null;
                        $cableLength = $surveyResult['cable_length'] ?? null;
                        $otherRelatedCost = $surveyResult['other_related_cost'] ?? null;
                        $zoneName = $surveyResult['zone_name'] ?? null;

                        $zoneCode = null;
                        if ($zoneName) {
                            try {
                                $ethioZone = app(ZoneService::class)->getEthioZoneByName($zoneName);
                                if ($ethioZone) {
                                    $zoneCode = $ethioZone->code;
                                    AppLogger::business()->info('Zone code found for manual survey', [
                                        'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                                        'zone_name' => $zoneName,
                                        'zone_code' => $zoneCode,
                                    ]);
                                } else {
                                    AppLogger::business()->warning('Ethio zone not found by name', [
                                        'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                                        'zone_name' => $zoneName,
                                    ]);
                                }
                            } catch (Throwable $e) {
                                AppLogger::business()->warning('Failed to lookup zone code', [
                                    'customer_survey_order_id' => $order->customer_survey_order_id ?? null,
                                    'zone_name' => $zoneName,
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        }

                        $hasAllRequiredFields = (
                            $mediaType !== null &&
                            $cableType !== null &&
                            $lineIndicator !== null
                        );

                        if ($hasAllRequiredFields) {
                            $statusUpdates[$order->id] = FFDServiceProvisionStatus::Completed->value;

                            $surveyResultData = [
                                'media_type' => $mediaType,
                                'cable_type' => $cableType,
                                'line_indicator' => $lineIndicator,
                                'cable_length' => $cableLength,
                                'other_related_cost' => $otherRelatedCost,
                                'survey_failure_reason' => null,
                                'zone_code' => $zoneCode,
                            ];

                            $deviceAlreadySelected = $order->with_device !== null;

                            if ($order->status !== FFDServiceProvisionStatus::Completed->value && ! $deviceAlreadySelected) {
                                $surveyResultData['with_device'] = null;
                                $surveyResultData['device_id'] = null;
                                $surveyResultData['device_voice_id'] = null;

                                $manualSurveyCompletedNotifications[] = [
                                    'phone' => $order->contact_no ?? null,
                                    'customer_name' => $order->contact_person ?? 'Customer',
                                    'service_type' => $order->main_offer_id,
                                    'order_number' => $order->customer_survey_order_id,
                                ];
                            }

                            $surveyResultUpdates[$order->id] = $surveyResultData;
                        } else {
                            $newStatus = (int) $response['status'];
                            if ($newStatus >= 1 && $newStatus <= 8) {
                                $statusUpdates[$order->id] = FFDServiceProvisionStatus::Waiting->value;
                            }
                        }
                    }
                } else {
                    $newStatus = (int) $response['status'];
                    if ($newStatus >= 1 && $newStatus <= 8) {
                        $statusUpdates[$order->id] = $newStatus;

                        if (
                            $newStatus === FFDServiceProvisionStatus::Completed->value &&
                            (int) $order->status !== FFDServiceProvisionStatus::Completed->value &&
                            ! empty($order->transaction_id)
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
                $timestampUpdates[] = $order->id;
            }
        }

        $this->batchUpdateStatuses($statusUpdates);
        $this->applySurveyResultUpdates($surveyResultUpdates);
        $this->batchUpdateTimestamps(array_unique($timestampUpdates));

        foreach ($manualSurveyCompletedNotifications as $notification) {
            if (! empty($notification['phone'])) {
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

        foreach ($manualSurveyFailedNotifications as $notification) {
            if (! empty($notification['phone'])) {
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

        foreach ($ecafUploads as $ecafData) {
            try {
                $this->uploadEcafForOrder($ecafService, $ecafData);
            } catch (Throwable $e) {
                AppLogger::api()->warning('ECAF upload failed during status refresh', [
                    'survey_order_id' => $ecafData['survey_order_id'],
                    'transaction_id' => $ecafData['transaction_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    protected function loadOrders(): \Illuminate\Support\Collection
    {
        $columns = [
            'id',
            'customer_survey_order_id',
            'customer_subscription_order_id',
            'survey_is_manual',
            'status',
            'contact_no',
            'contact_person',
            'main_offer_id',
            'with_device',
            'transaction_id',
            'customer_code',
            'device_id',
            'device_voice_id',
        ];

        return DB::table('survey_orders')
            ->whereIn('id', $this->orderIds)
            ->whereNull('deleted_at')
            ->select($columns)
            ->get();
    }

    protected function batchUpdateStatuses(array $statusUpdates): void
    {
        if (empty($statusUpdates)) {
            return;
        }

        $cases = [];
        $syncCases = [];
        $ids = [];
        $bindings = [];

        foreach ($statusUpdates as $id => $status) {
            $cases[] = 'WHEN id = ? THEN ?::bigint';
            $syncCases[] = 'WHEN id = ? THEN ?::bigint';
            $bindings[] = $id;
            $bindings[] = (int) $status;
            $ids[] = $id;
        }

        foreach ($statusUpdates as $id => $status) {
            $bindings[] = $id;
            $bindings[] = (int) $status;
        }

        $caseStatement = implode(' ', $cases);
        $syncCaseStatement = implode(' ', $syncCases);
        $idPlaceholders = implode(',', array_fill(0, count($ids), '?'));
        $bindings = array_merge($bindings, $ids);

        DB::update(
            "UPDATE survey_orders 
             SET status = (CASE {$caseStatement} END)::bigint,
                 last_synced_status = (CASE {$syncCaseStatement} END)::bigint,
                 updated_at = NOW()
             WHERE id IN ({$idPlaceholders})",
            $bindings
        );
    }

    protected function applySurveyResultUpdates(array $surveyResultUpdates): void
    {
        $allowedSurveyResultColumns = [
            'media_type',
            'cable_type',
            'line_indicator',
            'cable_length',
            'other_related_cost',
            'survey_failure_reason',
            'with_device',
            'device_id',
            'device_voice_id',
            'updated_at',
        ];

        foreach ($surveyResultUpdates as $orderId => $fields) {
            if (! empty($fields)) {
                $fields['updated_at'] = now();
                $payload = array_intersect_key($fields, array_flip($allowedSurveyResultColumns));
                if (! empty($payload)) {
                    SurveyOrder::where('id', $orderId)->update($payload);
                }
            }
        }
    }

    protected function batchUpdateTimestamps(array $orderIds): void
    {
        if (empty($orderIds)) {
            return;
        }

        DB::table('survey_orders')
            ->whereIn('id', $orderIds)
            ->update(['last_checked_at' => now()]);
    }

    protected function mapOfferIdToServiceType(mixed $offerId): string
    {
        return match ((int) $offerId) {
            1 => 'voice',
            2 => 'data',
            3 => 'combo',
            default => 'voice',
        };
    }

    protected function uploadEcafForOrder(EcafService $ecafService, array $ecafData): void
    {
        $customerCode = $ecafData['customer_code'];
        $transactionId = $ecafData['transaction_id'];
        $surveyOrderId = $ecafData['survey_order_id'];

        $customer = DB::table('customers')
            ->where('code', $customerCode)
            ->whereNull('deleted_at')
            ->select('picture', 'name')
            ->first();

        if (! $customer || empty($customer->picture)) {
            AppLogger::api()->warning('ECAF upload skipped: customer photo not available', [
                'survey_order_id' => $surveyOrderId,
                'customer_code' => $customerCode,
            ]);

            return;
        }

        $customerName = trim($customer->name ?? '');
        if ($customerName === '') {
            AppLogger::api()->warning('ECAF upload skipped: customer name not available', [
                'survey_order_id' => $surveyOrderId,
                'customer_code' => $customerCode,
            ]);

            return;
        }

        $response = $ecafService->uploadFile([
            'transaction_id' => $transactionId,
            'photo' => $customer->picture,
            'customer_code' => $customerCode,
            'name' => $customerName,
        ]);

        $data = $response instanceof \Illuminate\Http\JsonResponse
            ? $response->getData(true)
            : (array) $response;

        if ($data['success'] ?? false) {
            AppLogger::api()->info('ECAF document uploaded successfully', [
                'survey_order_id' => $surveyOrderId,
                'transaction_id' => $transactionId,
            ]);
        } else {
            AppLogger::api()->warning('ECAF document upload returned error', [
                'survey_order_id' => $surveyOrderId,
                'transaction_id' => $transactionId,
                'response' => $data,
            ]);
        }
    }
}
