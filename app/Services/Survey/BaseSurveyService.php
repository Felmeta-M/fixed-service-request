<?php

namespace App\Services\Survey;

use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Enums\OfferId;
use App\Enums\MediaType;
use App\Services\Payment\DeviceFeeCalculatorService;
use App\Services\Payment\PaymentCalculatorService;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\ResourceService;
use App\Services\Subscription\ServiceActivationService;
use App\Services\ZoneService;
use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

abstract class BaseSurveyService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 360;

    protected ?string $serviceNumber = null;

    public function __construct(
        protected readonly PaymentService $payment_service,
        protected readonly ServiceActivationService $activationService,
        protected readonly DeviceFeeCalculatorService $deviceFeeCalculator,
        protected readonly QueryAvailableNumberService $queryAvailableNumberService,
        protected readonly ReserveNumberService $reserveNumberService,
        protected readonly ZoneService $zoneService,
    ) {}

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    // transactionId(), processTime(), completedDate() are inherited from BaseApiService

    /** Same template method as Subscription */
    final public function create(array $data)
    {
        $resource = [
            'neid' => $data['survey_address_info']['neid'] ?? null,
            'distance' => $data['survey_address_info']['distance'] ?? null,
            'cable_type' => $data['survey_address_info']['cable_type'] ?? null,
            'longitude' => $data['survey_address_info']['longitude'] ?? null,
            'latitude' => $data['survey_address_info']['latitude'] ?? null,
            'area_code' => $data['survey_address_info']['area_code'] ?? null,
            'area_name' => $data['survey_address_info']['area_name'] ?? null,
        ];

        $resource = self::decrypt($resource);
        \Log::info('resource decrypted', [$resource]);

        if ($resource === null) {
            AppLogger::api()->error('Resource data validation failed - invalid or tampered information', [
                'operation' => 'survey_create',
                'survey_type' => $this->mainOfferId(),
            ]);
            return ApiResponse::error(
                'Invalid location information provided. Please select your location again and try submitting your request.',
                \App\Enums\ErrorCode::VALIDATION_ERROR,
                422
            );
        }

        // ============================================================
        // APPLY BACKEND DEFAULTS - Minimizes frontend payload
        // Frontend only needs to send main_offer_id and survey_address_info
        // ============================================================
        $data = $this->applyDefaults($data, $resource);

        \Log::info('data after apply defaults', [$data]);

        $xml = $this->buildXml($data, $resource);


        $response = $this->executeRequest($xml);

        $response = $this->parseResponse($data, $response, $resource);

        return $response;
    }

    /**
     * Apply default values for survey request fields.
     * Centralizes defaults to minimize frontend payload.
     *
     * @param array $data Request data from frontend
     * @param array $resource Decrypted resource data
     * @return array Data with defaults applied
     */
    protected function applyDefaults(array $data, array $resource): array
    {
        // Get customer profile and contact info from context
        $profile = $this->getCustomerProfile();
        $contact = $this->getPrimaryContact();

        $data['survey_type'] = $data['survey_type'] ?? 'EIC08';
        $data['oper_type'] = $data['oper_type'] ?? 'A';                    // A = new, M = modify

        $data['telecom_region'] = $resource['area_code'];
        $data['customer_type'] = 'residential';

        $data['contact_person'] = $data['contact_person'] ?? $contact['contact_person'] ?? null;
        $data['contact_no'] = $data['contact_no'] ?? $contact['contact_no'] ?? null;
        $data['contact_email'] = $data['contact_email'] ?? $contact['contact_email'] ?? null;

        $data['customer_code'] = $this->customerCode();


        $data['external_operid'] = $data['external_operid'] ?? '512';
        $data['with_device'] = $data['with_device'] ?? false;
        $data['survey_is_manual'] = $data['survey_is_manual'] ?? false;

        // Bandwidth default (10M = 10 Mbps) - only if not provided
        if (empty($data['bandwidth'])) {
            $data['bandwidth'] = '10M';
        }

        return $data;
    }

    protected function resourceCheck(array $data): array
    {
        $response = app(ResourceService::class)->check([
            'bandwidth' => $data['bandwidth'] ?? null,
            'longitude' => $data['survey_address_info']['longitude'],
            'latitude' => $data['survey_address_info']['latitude'],
        ]);

        $resource = $response->getData(true)['data'] ?? null;

        if (!$resource) {
            throw new RuntimeException('Resource check failed.');
        }

        return $resource;
    }

    protected function persistSurvey(
        string $surveyOrderId,
        array $data,
        ?array $resource
    ): void {

        $serviceNumber = $data['service_number'] ?? $this->serviceNumber ?? null;
        $mainOfferId = (int) ($data['main_offer_id'] ?? 0);
        $offerType = OfferId::tryFromInt($mainOfferId);
        $voiceServiceNumber = ($offerType && !$offerType->isBroadband()) ? $serviceNumber : null;
        $dataServiceNumber = ($offerType && $offerType->isBroadband()) ? $serviceNumber : null;
        if ($offerType?->isCombo()) {
            // Combo: at survey create we typically have voice first; data may come later from BSS
            $voiceServiceNumber = $serviceNumber;
            $dataServiceNumber = null;
        }

        // Convert bandwidth to KB for consistent storage (BSS returns KB format)
        $bandwidthKb = null;
        if (!empty($data['bandwidth'])) {
            $bandwidthKb = $this->parseBandwidth($data['bandwidth']);
        }

        // Track total amount for auto-subscription decision
        $totalAmount = 0;
        $isManualSurvey = (bool) ($data['survey_is_manual'] ?? false);

        DB::transaction(function () use ($surveyOrderId, $data, $resource, $serviceNumber, $voiceServiceNumber, $dataServiceNumber, $bandwidthKb, &$totalAmount, $isManualSurvey) {
            $areaCode = $resource['area_code'] ?? null;
            $areaName = $resource['area_name'] ?? null;
            $zoneCode = $resource['zone_code'] ?? null;
            $cableType = $resource['cable_type'] ?? null;

            if (!$zoneCode && !$isManualSurvey) {
                $zoneCode = $this->zoneService->getZoneCodeFromAreaCode($areaCode, $areaName);
            }

            $mediaType = $isManualSurvey ? null : $this->deriveMediaTypeFromCableType($cableType);

            // Fetch device_offer_id from the selected device (critical for subscription)
            $deviceOfferId = null;
            $deviceId = $data['device_id'] ?? null;
            if ($deviceId) {
                $device = \App\Models\AvailableDevice::find($deviceId);
                $deviceOfferId = $device?->offer_id;
            }

            $deviceVoiceOfferId = null;
            $deviceVoiceId = $data['device_voice_id'] ?? null;
            if ($deviceVoiceId) {
                $deviceVoice = \App\Models\AvailableDevice::find($deviceVoiceId);
                $deviceVoiceOfferId = $deviceVoice?->offer_id;
            }

            // Derive latitude/longitude for local DB from decrypted resource only.
            $latitude = isset($resource['latitude']) && $resource['latitude'] !== ''
                ? round((float) $resource['latitude'], 8)
                : null;
            $longitude = isset($resource['longitude']) && $resource['longitude'] !== ''
                ? round((float) $resource['longitude'], 8)
                : null;

            $survey = SurveyOrder::create([
                // Explicitly map only known columns to avoid leaking encrypted fields or nested arrays.
                'customer_id' => $data['customer_id'] ?? null,
                'customer_code' => $data['customer_code'] ?? $this->customerCode(),
                'customer_survey_order_id' => $surveyOrderId,
                'main_offer_id' => (int) ($data['main_offer_id'] ?? 0),
                'voice_service_number' => $voiceServiceNumber,
                'data_service_number' => $dataServiceNumber,
                'internet_account' => $data['internet_account'] ?? null,
                'internet_password' => $data['internet_password'] ?? null,
                'survey_type' => $data['survey_type'] ?? 'EIC08',
                'telecom_region' => $data['telecom_region'] ?? $areaCode,
                'area_code' => $areaCode,
                'area_name' => $areaName,
                'oper_type' => $data['oper_type'] ?? 'A',
                'customer_type' => $data['customer_type'] ?? 'residential',
                'bandwidth' => $bandwidthKb,
                'contact_person' => $data['contact_person'] ?? null,
                'contact_no' => $data['contact_no'] ?? null,
                'contact_email' => $data['contact_email'] ?? null,
                'sec_contact_person' => $data['sec_contact_person'] ?? null,
                'sec_contact_no' => $data['sec_contact_no'] ?? null,
                'sec_contact_email' => $data['sec_contact_email'] ?? null,
                'status' => $isManualSurvey ? FFDServiceProvisionStatus::Waiting->value : FFDServiceProvisionStatus::Completed->value,
                'cancel_reason' => $data['cancel_reason'] ?? null,
                'completed_date' => now(),
                'cable_length' => isset($resource['distance']) ? (float) $resource['distance'] : null,
                'cable_type' => $cableType,
                'cable_charge' => $data['cable_charge'] ?? null,
                'other_related_cost' => $data['other_related_cost'] ?? null,
                'media_type' => $mediaType,
                'line_indicator' => $data['line_indicator'] ?? null,
                'survey_failure_reason' => null,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'customer_latitude' => isset($data['customer_latitude']) ? round((float) $data['customer_latitude'], 8) : null,
                'customer_longitude' => isset($data['customer_longitude']) ? round((float) $data['customer_longitude'], 8) : null,
                'with_device' => (bool) ($data['with_device'] ?? false),
                'device_id' => $deviceId,
                'device_voice_id' => $deviceVoiceId,
                'device_offer_id' => $deviceOfferId,
                'device_voice_offer_id' => $deviceVoiceOfferId,
                'survey_is_manual' => $isManualSurvey,
                'zone_code' => $zoneCode,
            ]);

            $profile = $this->getCustomerProfile();

            $requestData = [
                'service_number' => $serviceNumber,
                'voice_service_number' => $survey->voice_service_number,
                'data_service_number' => $survey->data_service_number,
                'offering_id' => $survey->main_offer_id,
                'network_type' => 4, // Fixed network
                'sub_type' => 0,
                'customer_type' => $profile['customer_type'],
                'customer_category' => $profile['customer_category'],
                'customer_subcategory' => $profile['customer_subcategory'],
                'customer_level' => $profile['customer_level'],
                'customer_nationality' => $profile['nationality'],
                'customer_id_type' => $profile['identification_type'],
            ];

            $calculator = app(PaymentCalculatorService::class);
            $fees = $calculator->calculateFees($survey, $requestData);

            // Calculate device fee using dedicated service
            $deviceFee = $this->deviceFeeCalculator->calculate($survey);

            // Labour/material cost from survey (BSS 1924)
            $otherRelatedCost = (float) ($survey->other_related_cost ?? 0);
            $totalAmount = $fees['total_amount'] + $deviceFee + $otherRelatedCost;

            // Use new attributes for payment primary number
            $paymentPrimaryNumber = $survey->voice_service_number ?? $survey->data_service_number;
            $this->payment_service->createOrUpdatePayment([
                'customer_survey_order_id' => $survey->customer_survey_order_id,
                'service_number' => $paymentPrimaryNumber,
                'subscription_fee' => $fees['subscription_fee'],
                'cable_charge' => $fees['cable_charge'],
                'device_fee' => $deviceFee,
                'other_related_cost' => $otherRelatedCost,
                'total_amount' => $totalAmount,
            ]);
        });

        // Auto-activate for free services (non-manual surveys only)
        // Manual surveys need device selection first, so skip auto-activation
        // 
        // IMPORTANT: This activation is INDEPENDENT of the DB transaction above.
        // The survey/payment records are already committed at this point.
        // If activation fails, the survey is still valid and customer can manually subscribe later.
        if ($totalAmount < 1 && !$isManualSurvey) {
            // Wait for third-party system to be ready to process activation
            // after survey creation (min 7.5ms required)
            usleep(20000); // 20 seconds

            $this->activationService->activate($surveyOrderId);
        }
    }

    /**
     * Decrypt resource fields with strict validation.
     * 
     * All resource fields are critical and required. If any encrypted field
     * cannot be decrypted (indicating tampered or invalid data), the operation
     * is stopped immediately for security reasons.
     * 
     * @param array $data Encrypted resource data
     * @return array|null Decrypted data, or null if validation fails (tampered/invalid data)
     */
    public static function decrypt(array $data): ?array
    {
        $decrypted = [];

        // All fields are critical and required - no field should be tampered
        $criticalFields = ['neid', 'distance', 'cable_type', 'latitude', 'longitude', 'area_code', 'area_name'];
        $optionalFields = ['zone_code'];

        foreach ($criticalFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                try {
                    $decrypted[$field] = Crypt::decryptString($data[$field]);
                } catch (\Exception $e) {
                    return null;
                }
            } else {
                return null;
            }
        }

        foreach ($optionalFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                try {
                    $decrypted[$field] = Crypt::decryptString($data[$field]);
                } catch (\Exception $e) {
                    // Optional field - continue
                }
            }
        }

        return $decrypted;
    }

    protected function deriveMediaTypeFromCableType(?string $cableType): ?string
    {
        if ($cableType === null || $cableType === '') {
            return null;
        }

        return match ($cableType) {
            '3' => MediaType::PON->value,
            '1', '2' => MediaType::COPPER->value,
            default => MediaType::PON->value,
        };
    }

    /**
     * Format coordinate value for XML.
     */
    protected function formatCoordinate(?string $coordinate): string
    {
        if (empty($coordinate)) {
            return '0';
        }

        // Remove any unexpected characters (whitespace, newlines, etc.)
        $coordinate = trim($coordinate);

        // Ensure it's a valid numeric value
        if (!is_numeric($coordinate)) {
            AppLogger::api()->warning('Invalid coordinate value detected', [
                'coordinate' => $coordinate,
                'operation' => 'format_coordinate',
            ]);
            return '0';
        }

        // Format as decimal with up to 8 decimal places
        return (string) round((float) $coordinate, 8);
    }

    /**
     * Validate survey order exists and is in valid state.
     * Common validation logic for survey operations.
     *
     * @param string $surveyOrderId Customer survey order ID
     * @return SurveyOrder Survey order model
     * @throws RuntimeException If survey order not found
     */
    protected function validateSurveyOrder(string $surveyOrderId): SurveyOrder
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();

        if (!$surveyOrder) {
            AppLogger::api()->error('Survey order not found', [
                'survey_order_id' => $surveyOrderId,
            ]);
            throw new RuntimeException('Survey order not found: ' . $surveyOrderId);
        }

        return $surveyOrder;
    }

    /** Service-specific hooks */
    abstract protected function mainOfferId(): int;
    abstract protected function buildXml(array $data, array $resource): string;
    abstract protected function parseResponse(
        array $data,
        string $xml,
        array $resource
    );
}
