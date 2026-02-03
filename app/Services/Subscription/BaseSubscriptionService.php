<?php

namespace App\Services\Subscription;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\AvailableDevice;
use App\Models\SurveyOrder;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\ZoneService;
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

        if (
            $surveyOrder->customer_subscription_order_id &&
            $surveyOrder->status === FFDServiceProvisionStatus::Completed->value
        ) {
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

    abstract protected function mainOfferingId(): int;
    abstract protected function businessCode(): string;
    abstract protected function networkType(): int;

    protected function getZoneCodeForCustomerAddress(array $data): string
    {
        $zoneCode = $this->zoneService->getZoneCodeForCustomerAddress($data);

        if (!$zoneCode) {
            throw new \RuntimeException('Zone information is missing. Please contact support.');
        }

        return $zoneCode;
    }

    protected function getZoneCodeForAccountInfo(string $surveyOrderId, ?array $data = null): string
    {
        $zoneCode = $this->zoneService->getZoneCodeForAccountInfo($surveyOrderId, $data);

        if (!$zoneCode) {
            throw new \RuntimeException('Zone information is missing. Please contact support.');
        }

        return $zoneCode;
    }

    protected function getZoneCodeById(int|string $zoneId): string
    {
        $zoneCode = $this->zoneService->getZoneCodeById($zoneId);

        if (!$zoneCode) {
            throw new \RuntimeException('Zone not found in our system. Please contact support.');
        }

        return $zoneCode;
    }

    /**
     * Builds the SupplementaryOfferingList XML section conditionally based on with_device flag.
     * Shared by Data and Combo subscription services for device offerings.
     *
     * @param array $data Must contain with_device, optionally device_offer_id and device_id
     * @return string XML fragment or empty string
     */
    protected function buildSupplementaryOfferingList(array $data): string
    {
        $withDevice = (bool) ($data['with_device'] ?? false);

        if (!$withDevice) {
            return '';
        }

        $deviceOfferId = $data['device_offer_id'] ?? null;

        if (empty($deviceOfferId) && !empty($data['device_id'])) {
            $device = AvailableDevice::find($data['device_id']);
            $deviceOfferId = $device?->offer_id;
        }

        if (empty($deviceOfferId)) {
            return '';
        }

        return <<<XML
                  <com:SupplementaryOfferingList>
                     <com:OfferingInstance>
                        <com:OfferingId>
                           <com:OfferingId>{$deviceOfferId}</com:OfferingId>
                        </com:OfferingId>
                        <com:InstanceProperty>
                           <com:PropertyCode>50135</com:PropertyCode>
                           <com:PropertyType>1</com:PropertyType>
                           <com:Value>2701DTU</com:Value>
                        </com:InstanceProperty>
                        <com:InstanceProperty>
                           <com:PropertyCode>50134</com:PropertyCode>
                           <com:PropertyType>1</com:PropertyType>
                           <com:Value>2</com:Value>
                        </com:InstanceProperty>
                     </com:OfferingInstance>
                     <com:EffectiveMode>0</com:EffectiveMode>
                  </com:SupplementaryOfferingList>
XML;
    }

    /**
     * Builds CalcOneOffFeeETC XML for device one-off fee. Shared by Data and Combo subscription services.
     *
     * @param array $data Must contain device_id
     * @return string XML fragment or empty string
     */
    protected function oneOffFeeCalculation(array $data): string
    {
        $device = AvailableDevice::find($data['device_id'] ?? null);
        if (empty($device)) {
            return '';
        }

        $oneOffFee = $this->calculateOneOffFee((float) $device->price, (float) $device->discount);
        $originalFee = $oneOffFee['original_fee'];
        $taxFee = $oneOffFee['tax_fee'];
        $calculatedFee = $oneOffFee['calculated_fee'];
        $itemCode = $device->item_code;
        $itemName = $device->item_name ?? 'Device purchase';
        $feeType = 'One-Off Change';
        $currencyId = 1048; // ETB
        $payType = 1; // CASH
        $taxCode = 'CC_TAX_VAT';
        $taxName = 'VAT';
        $discountFee = $oneOffFee['discount_fee'];

        return <<<XML
<com:CalcOneOffFeeETC>
    <com:FeeItemCode>{$itemCode}</com:FeeItemCode>
    <com:FeeItemName>{$itemName}</com:FeeItemName>
    <com:FeeType>{$feeType}</com:FeeType>
    <com:CurrencyID>{$currencyId}</com:CurrencyID>
    <com:CaculatedFee>{$calculatedFee}</com:CaculatedFee>
    <com:OriginalFee>{$originalFee}</com:OriginalFee>
    <com:DiscountFee>{$discountFee}</com:DiscountFee>
    <com:TaxInfo>
        <com:TaxCode>{$taxCode}</com:TaxCode>
        <com:TaxName>{$taxName}</com:TaxName>
        <com:TaxFee>{$taxFee}</com:TaxFee>
        <com:TaxRate>0.15</com:TaxRate>
    </com:TaxInfo>
    <com:PayType>{$payType}</com:PayType>
</com:CalcOneOffFeeETC>
XML;
    }

    /**
     * Calculates one-off fee (price, tax, discount). Shared by Data and Combo subscription services.
     *
     * @param float $price Base price in birr
     * @param float $discount Discount (e.g. percentage as decimal)
     * @param float $taxRate Tax rate (default 0.15)
     * @param int $precision Decimal precision
     * @return array{original_fee: float, tax_rate: float, tax_fee: float, calculated_fee: float, discount_fee: float}
     */
    protected function calculateOneOffFee(
        float $price,
        float $discount = 0.0,
        float $taxRate = 0.15,
        int $precision = 4
    ): array {
        $taxFee = round($price * $taxRate, $precision);
        $discountFee = round($price * $discount, $precision);
        $calculatedFee = round($price + $taxFee - $discountFee, $precision);

        return [
            'original_fee' => round($price, $precision),
            'tax_rate' => $taxRate,
            'tax_fee' => $taxFee,
            'calculated_fee' => $calculatedFee,
            'discount_fee' => $discountFee,
        ];
    }

    /**
     * Builds data array for data/FBB device (SupplementaryOfferingList and oneOffFeeCalculation).
     * Used by Data subscription and by Combo's data SubBusiOrderlist.
     *
     * @param array $data Full payload with device_id, device_offer_id
     * @return array With with_device, device_id, device_offer_id keyed for base class methods
     */
    protected function dataDeviceData(array $data): array
    {
        $deviceId = $data['device_id'] ?? null;

        return [
            'with_device' => !empty($deviceId),
            'device_id' => $deviceId,
            'device_offer_id' => $data['device_offer_id'] ?? null,
        ];
    }
}
