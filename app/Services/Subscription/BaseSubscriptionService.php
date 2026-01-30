<?php

namespace App\Services\Subscription;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\ZoneService;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

abstract class BaseSubscriptionService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 30;
    protected ?string $serviceNumber = null;

    public function __construct(
        protected readonly PaymentService $payment_service,
        protected readonly QueryAvailableNumberService $queryAvailableNumberService,
        protected readonly ReserveNumberService $reserveNumberService,
        protected readonly ZoneService $zoneService,
    ) {
    }

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    // transactionId(), processTime(), completedDate() are inherited from BaseApiService

    protected function generateEmail(): string
    {
        return strtolower(Str::random(8) . '@qq.com');
    }

    /**
     * Persist subscription updates to survey order and payment tables.
     * Common function for all subscription services (Voice, Data, Combo).
     *
     * @param string $surveyOrderId Customer survey order ID
     * @param string $customerSubscriptionOrderId Customer subscription order ID from vendor
     * @param string|null $serviceNumber Optional service number (for data subscriptions)
     * @param string $serviceType Service type for logging ('voice', 'data', 'combo')
     * @return bool True if update was successful, false otherwise
     */
    protected function persistSubscription(
        string $surveyOrderId,
        string $customerSubscriptionOrderId,
        ?string $serviceNumber = null,
        string $serviceType = 'subscription'
    ): bool {
        try {
            $updateData = [
                'status' => FFDServiceProvisionStatus::Waiting->value,
                'subscribed_at' => now(),
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
            ];

            // Include service_number if provided (e.g., for data subscriptions)
            if ($serviceNumber !== null) {
                $updateData['service_number'] = $serviceNumber;
            }

            $updated = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)
                ->update($updateData);

            if (!$updated) {
                AppLogger::api()->warning('Failed to update survey order after subscription', [
                    'survey_order_id' => $surveyOrderId,
                    'customer_subscription_order_id' => $customerSubscriptionOrderId,
                    'service_type' => $serviceType,
                ]);
                return false;
            }

            AppLogger::api()->info('Survey order updated after subscription', [
                'survey_order_id' => $surveyOrderId,
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
                'service_number' => $serviceNumber ?? $this->serviceNumber,
                'service_type' => $serviceType,
            ]);

            // Update payment table with customer_subscription_order_id (important for manual subscriptions)
            $this->updatePaymentWithSubscriptionOrderId($surveyOrderId, $customerSubscriptionOrderId, $serviceType);

            return true;
        } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Exception updating survey order after subscription', [
                'survey_order_id' => $surveyOrderId,
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
                'service_type' => $serviceType,
            ]);
            return false;
        }
    }

    /**
     * Update payment table with customer_subscription_order_id.
     * Extracted to reduce duplication across subscription services.
     *
     * @param string $surveyOrderId Customer survey order ID
     * @param string $customerSubscriptionOrderId Customer subscription order ID
     * @param string $serviceType Service type for logging
     * @return void
     */
    protected function updatePaymentWithSubscriptionOrderId(
        string $surveyOrderId,
        string $customerSubscriptionOrderId,
        string $serviceType = 'subscription'
    ): void {
        try {
            DB::table('payments')
                ->where('customer_survey_order_id', $surveyOrderId)
                ->update(['customer_subscription_order_id' => $customerSubscriptionOrderId]);

            AppLogger::api()->info('Payment updated with customer_subscription_order_id after subscription', [
                'survey_order_id' => $surveyOrderId,
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
                'service_type' => $serviceType,
            ]);
        } catch (\Throwable $e) {
            AppLogger::api()->warning('Failed to update payment with customer_subscription_order_id', [
                'survey_order_id' => $surveyOrderId,
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
                'error' => $e->getMessage(),
                'service_type' => $serviceType,
            ]);
            // Don't fail the entire operation if payment update fails
        }
    }

    /**
     * Check if survey order is already subscribed (duplicate prevention).
     * Common validation logic for all subscription services.
     *
     * @param string $surveyOrderId Customer survey order ID
     * @return array|null Returns error response array if duplicate found, null otherwise
     */
    protected function checkDuplicateSubscription(string $surveyOrderId): ?array
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();

        if (!$surveyOrder) {
            throw new \RuntimeException('Survey order not found: ' . $surveyOrderId);
        }

        if ($surveyOrder->customer_subscription_order_id && 
            $surveyOrder->status === FFDServiceProvisionStatus::Completed->value) {
            AppLogger::api()->warning('Attempted duplicate subscription', [
                'survey_order_id' => $surveyOrderId,
                'current_status' => $surveyOrder->status,
                'customer_subscription_order_id' => $surveyOrder->customer_subscription_order_id,
            ]);

            return [
                'success' => false,
                'ret_code' => 'DUPLICATE',
                'ret_msg' => 'This survey order has already been used to create a subscription.',
                'customer_busi_order_id' => null,
                'extra_params' => [],
            ];
        }

        return null;
    }

    /**
     * Update survey order with subscription data and additional fields.
     * Extracted to reduce duplication when updating survey orders with extra data.
     *
     * @param string $surveyOrderId Survey order ID
     * @param string $customerSubscriptionOrderId Subscription order ID
     * @param array $additionalData Additional fields to update (e.g., internet_account, service_number, etc.)
     * @param string $serviceType Service type for logging
     * @return bool True if update was successful
     */
    protected function updateSurveyOrderWithSubscriptionData(
        string $surveyOrderId,
        string $customerSubscriptionOrderId,
        array $additionalData = [],
        string $serviceType = 'subscription'
    ): bool {
        try {
            $updateData = array_merge([
                'status' => FFDServiceProvisionStatus::Waiting->value,
                'subscribed_at' => now(),
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
            ], $additionalData);

            $updated = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)
                ->update($updateData);

            if ($updated) {
                AppLogger::api()->info('Survey order updated with subscription data', [
                    'survey_order_id' => $surveyOrderId,
                    'customer_subscription_order_id' => $customerSubscriptionOrderId,
                    'service_type' => $serviceType,
                    'updated_fields' => array_keys($additionalData),
                ]);
                return true;
            } else {
                AppLogger::api()->warning('Failed to update survey order with subscription data', [
                    'survey_order_id' => $surveyOrderId,
                    'customer_subscription_order_id' => $customerSubscriptionOrderId,
                    'service_type' => $serviceType,
                ]);
                return false;
            }
        } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Exception updating survey order with subscription data', [
                'survey_order_id' => $surveyOrderId,
                'customer_subscription_order_id' => $customerSubscriptionOrderId,
                'service_type' => $serviceType,
            ]);
            return false;
        }
    }

    /** Service-specific constants */
    abstract protected function offeringId(): int;
    abstract protected function businessCode(): string;
    abstract protected function networkType(): int;

    /**
     * Get zone code for CustomerAddressInfo XML.
     * Delegates to ZoneService - single source of truth.
     *
     * @throws \RuntimeException If zone code cannot be found
     */
    protected function getZoneCodeForCustomerAddress(array $data): string
    {
        $zoneCode = $this->zoneService->getZoneCodeForCustomerAddress($data);

        if (!$zoneCode) {
            AppLogger::api()->error('Zone code not found for CustomerAddressInfo', [
                'data_keys' => array_keys($data),
                'has_customer_context' => CustomerContext::isAuthenticated(),
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Zone information is missing. Please provide a valid zone selection.'
            );
        }

        return $zoneCode;
    }

    /**
     * Get zone code for AccountInfo XML.
     * Delegates to ZoneService - single source of truth.
     *
     * @throws \RuntimeException If zone code cannot be found
     */
    protected function getZoneCodeForAccountInfo(string $surveyOrderId, ?array $data = null): string
    {
        $zoneCode = $this->zoneService->getZoneCodeForAccountInfo($surveyOrderId, $data);

        if (!$zoneCode) {
            AppLogger::api()->error('Zone code not found for AccountInfo', [
                'survey_order_id' => $surveyOrderId,
                'has_customer_context' => CustomerContext::isAuthenticated(),
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Zone information is missing. Please contact support.'
            );
        }

        return $zoneCode;
    }

    /**
     * Get zone code by zone ID.
     * Delegates to ZoneService - single source of truth.
     *
     * @throws \RuntimeException If zone code cannot be found
     */
    protected function getZoneCodeById(int|string $zoneId): string
    {
        $zoneCode = $this->zoneService->getZoneCodeById($zoneId);

        if (!$zoneCode) {
            AppLogger::api()->error('Zone code not found for zone ID', [
                'zone_id' => $zoneId,
            ]);
            throw new \RuntimeException(
                'Unable to process: The selected zone is not found in our system. Please contact support.'
            );
        }

        return $zoneCode;
    }
}
