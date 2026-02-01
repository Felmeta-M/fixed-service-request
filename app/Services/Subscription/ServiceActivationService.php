<?php

namespace App\Services\Subscription;

use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\DB;

/**
 * Service responsible for activating/subscribing services after survey completion.
 * 
 * This service is called:
 * - Automatically after successful payment confirmation (paid services)
 * - Automatically during survey persist for free services
 * - Manually by customer when auto-activation fails (fallback)
 */
class ServiceActivationService
{
    public function __construct(
        protected SubscriptionServiceFactory $factory
    ) {
    }

    /**
     * Activate/subscribe a service for the given survey order.
     * 
     * @param string $customerSurveyOrderId The survey order ID to activate
     * @return bool True if activation succeeded, false otherwise
     */
    public function activate(string $customerSurveyOrderId): bool
    {
        $record = DB::table('survey_orders as sr')
            ->join('customers as c', 'c.code', '=', 'sr.customer_code')
            ->where('sr.customer_survey_order_id', $customerSurveyOrderId)
            ->orderByDesc('sr.id')
            ->select([
                'sr.customer_code',
                'sr.main_offer_id',
                'c.name',
                'c.phone_number',
                'c.zone',
            ])
            ->first();

        if (!$record) {
            AppLogger::api()->warning('Survey order or customer not found for service activation', [
                'customer_survey_order_id' => $customerSurveyOrderId,
            ]);
            return false;
        }

        $data = [
            'survey_order_id' => $customerSurveyOrderId,
            'customer_code' => $record->customer_code,
            'name' => trim($record->name),
            'main_offer_id' => $record->main_offer_id,
            'sms_no' => $record->phone_number,
            'zone' => $record->zone,
        ];

        try {
            // Call the third-party subscription service
            $service = $this->factory->make($data['main_offer_id']);
            $service->create($data);

            AppLogger::api()->info('Service activated successfully', [
                'survey_order_id' => $customerSurveyOrderId,
                'main_offer_id' => $data['main_offer_id'],
                'customer_code' => $data['customer_code'],
            ]);

            return true;
        } catch (\Throwable $e) {
            AppLogger::api()->error('Service activation failed', [
                'survey_order_id' => $customerSurveyOrderId,
                'main_offer_id' => $data['main_offer_id'],
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
