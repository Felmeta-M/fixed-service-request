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
        // Get survey order with customer info
        // zone_code comes from survey_order (set during survey creation from area_name/area_code)
        // NOT from customer address
        $record = DB::table('survey_orders as sr')
            ->join('customers as c', 'c.code', '=', 'sr.customer_code')
            ->where('sr.customer_survey_order_id', $customerSurveyOrderId)
            ->orderByDesc('sr.id')
            ->select([
                'sr.customer_code',
                'sr.main_offer_id',
                'sr.zone_code',
                'sr.area_code',
                'sr.area_name',
                'sr.with_device',
                'sr.device_id',
                'sr.device_voice_id',
                'sr.device_offer_id',
                'c.name',
                'c.phone_number',
            ])
            ->first();

        if (!$record) {
            AppLogger::api()->warning('Survey order or customer not found for service activation', [
                'customer_survey_order_id' => $customerSurveyOrderId,
            ]);
            return false;
        }

        // Validate zone_code is present (required for subscription)
        if (empty($record->zone_code)) {
            AppLogger::api()->error('Survey order missing zone_code for service activation', [
                'customer_survey_order_id' => $customerSurveyOrderId,
                'area_code' => $record->area_code,
                'area_name' => $record->area_name,
            ]);
            return false;
        }

        $data = [
            'survey_order_id' => $customerSurveyOrderId,
            'customer_code' => $record->customer_code,
            'name' => trim($record->name),
            'main_offer_id' => $record->main_offer_id,
            'zone_code' => $record->zone_code,
            'sms_no' => $record->phone_number,
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
