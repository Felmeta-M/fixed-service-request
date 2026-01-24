<?php

namespace App\Services\Subscription;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\EthioZone;
use App\Models\SurveyOrder;
use App\Models\TelecomRegion;
use App\Models\Zone;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Support\CustomerContext;
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

    /**
     * Get zone_code from data array.
     * Used for CustomerAddressInfo EthioZoneOrRegion field.
     *
     * Supports:
     * - Anonymous requests (webhooks): Pass zone in data array
     * - New customer selection: Pass zone in data array
     * - Logged-in customer: Falls back to customer profile if zone missing in data
     *
     * @param array $data Data array containing 'zone'
     * @return string Zone code
     * @throws \RuntimeException If zone or zone_code cannot be found
     */
    protected function getCustomerZoneCode(array $data): string
    {
        // 1. Priority: Logged-in customer context (Existing Customer)
        $zoneId = CustomerContext::zone();

        // 2. Fallback: Data array (Webhook / New Customer / Anonymous)
        if (!$zoneId) {
            $zoneId = $data['zone'] ?? $data['address']['zone'] ?? null;
        }

        // 3. Validation
        if (!$zoneId) {
            AppLogger::api()->error('Zone not found in data or customer context for zone_code lookup', [
                'data_keys' => array_keys($data),
                'has_customer_context' => CustomerContext::isAuthenticated(),
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Zone information is missing. Please provide a valid zone selection.'
            );
        }

        return $this->getZoneCodeById($zoneId);
    }

    /**
     * Get zone_code from a zone ID.
     * Core lookup function - single source of truth for zone code resolution.
     *
     * @param int|string $zoneId The zone ID or name
     * @return string Zone code
     * @throws \RuntimeException If zone or zone_code cannot be found
     */
    protected function getZoneCodeById(int|string $zoneId): string
    {
        // Try to find zone by ID if numeric
        $zone = null;
        if (is_numeric($zoneId)) {
            $zone = Zone::find($zoneId);
        }

        // If not found by ID or not numeric, try to find by name
        if (!$zone) {
            $zone = Zone::where('name', $zoneId)->first();
        }

        if (!$zone) {
            AppLogger::api()->error('Zone not found in database', [
                'zone_id' => $zoneId,
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: The selected zone is not found in our system. Please contact support or update your profile with a valid zone.'
            );
        }

        if (!$zone->zone_code) {
            AppLogger::api()->error('Zone code not found for zone', [
                'zone_id' => $zone->id,
                'zone_name' => $zone->name,
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Zone code is missing for the selected zone. Please contact support for assistance.'
            );
        }

        return $zone->zone_code;
    }

    /**
     * Get ethio_zone id from survey_order area_code.
     * Used for AccountInfo ethioZoneOrRegion field.
     *
     * @param string $surveyOrderId Survey order ID
     * @return string Ethio zone ID
     * @throws \RuntimeException If area_code, telecom_region, or ethio_zone cannot be found
     */
    protected function getAccountEthioZoneId(string $surveyOrderId): string
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();
        if (!$surveyOrder) {
            AppLogger::api()->error('Survey order not found for ethio_zone lookup', [
                'survey_order_id' => $surveyOrderId,
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Survey order not found. Please contact support for assistance.'
            );
        }

        if (!$surveyOrder->area_code) {
            AppLogger::api()->error('Area code not found in survey order', [
                'survey_order_id' => $surveyOrderId,
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Area code information is missing from your survey order. Please contact support for assistance.'
            );
        }

        // Find telecom_region by area_code (which maps to area_id in telecom_regions table)
        $telecomRegion = TelecomRegion::where('area_id', $surveyOrder->area_code)
            ->where('status', true)
            ->first();

        if (!$telecomRegion) {
            AppLogger::api()->error('Telecom region not found for area code', [
                'area_code' => $surveyOrder->area_code,
                'survey_order_id' => $surveyOrderId,
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: The area code from your survey order does not match any telecom region in our system. Please contact support for assistance.'
            );
        }

        if (!$telecomRegion->zone) {
            AppLogger::api()->error('Zone not found in telecom region', [
                'area_code' => $surveyOrder->area_code,
                'telecom_region_id' => $telecomRegion->id,
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: Zone information is missing for the selected area. Please contact support for assistance.'
            );
        }

        // Find ethio_zone by zone name
        // Based on seeder data: ethio_zones has base names like "NAAZ", "EAAZ", "CAAZ"
        // while telecom_regions may have suffixes like "NAAZ-2", "EAAZ-1", etc.

        $requestedZone = trim($telecomRegion->zone);

        // Step 1: Try exact match (case-insensitive)
        $ethioZone = EthioZone::whereRaw('UPPER(name) = ?', [strtoupper($requestedZone)])->first();

        // Step 2: If not found, extract base name by removing suffix patterns
        // Patterns: "NAAZ-2" -> "NAAZ", "EAAZ_1" -> "EAAZ", "CAAZ-10" -> "CAAZ"
        if (!$ethioZone) {
            // Remove trailing dash/underscore followed by digits
            $baseZoneName = preg_replace('/[-_]\d+$/', '', $requestedZone);

            // Try exact match with base name (case-insensitive)
            $ethioZone = EthioZone::whereRaw('UPPER(name) = ?', [strtoupper($baseZoneName)])->first();

            // Step 3: If still not found, try prefix match (e.g., "NAAZ-2" matches "NAAZ")
            // Order by length to prefer shorter/more exact matches
            if (!$ethioZone && $baseZoneName !== $requestedZone) {
                $ethioZone = EthioZone::whereRaw('UPPER(name) LIKE ?', [strtoupper($baseZoneName) . '%'])
                    ->orderByRaw('LENGTH(name) ASC')
                    ->first();
            }
        }

        // Log the match result
        if ($ethioZone) {
            $matchType = strtoupper($requestedZone) === strtoupper($ethioZone->name) ? 'exact' : 'partial';
            AppLogger::api()->info("Ethio zone found using {$matchType} match", [
                'requested_zone' => $requestedZone,
                'matched_zone' => $ethioZone->name,
                'ethio_zone_id' => $ethioZone->id,
                'ethio_zone_code' => $ethioZone->code,
                'area_code' => $surveyOrder->area_code,
            ]);
        } else {
            $baseZoneName = preg_replace('/[-_]\d+$/', '', $requestedZone);
            AppLogger::api()->error('Ethio zone not found by name (exact or partial match)', [
                'zone_name' => $requestedZone,
                'base_zone_name' => $baseZoneName,
                'area_code' => $surveyOrder->area_code,
                'available_zones_sample' => EthioZone::limit(10)->pluck('name')->toArray(),
            ]);
            throw new \RuntimeException(
                'Unable to process subscription: The zone information from your survey order does not match any zone in our system. Please contact support for assistance.'
            );
        }

        return (string) $ethioZone->id;
    }
}
