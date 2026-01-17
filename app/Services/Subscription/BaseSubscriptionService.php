<?php

namespace App\Services\Subscription;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

abstract class BaseSubscriptionService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 30;
    protected ?string $serviceNumber = null;

    public function __construct(
        protected readonly PaymentService $payment_service,
        protected readonly QueryAvailableNumberService $queryAvailableNumberService,
        protected readonly ReserveNumberService $reserveNumberService,
    ) {
    }

    protected function endpoint(): string
    {
        return config('services.subscriber.endpoint');
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

    /** Service-specific constants */
    abstract protected function offeringId(): int;
    abstract protected function businessCode(): string;
    abstract protected function networkType(): int;
}
