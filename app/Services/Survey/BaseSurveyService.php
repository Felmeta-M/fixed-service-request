<?php

namespace App\Services\Survey;

use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
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
use RuntimeException;

abstract class BaseSurveyService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 30;

    protected ?string $serviceNumber = null;

    public function __construct(
        protected readonly PaymentService $payment_service,
        protected readonly ServiceActivationService $activationService,
        protected readonly DeviceFeeCalculatorService $deviceFeeCalculator,
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

        $xml = $this->buildXml($data, $resource);

        $response = $this->executeRequest($xml);

        return $this->parseResponse($data, $response, $resource);
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

        // Survey classification defaults
        $data['survey_type'] = $data['survey_type'] ?? 'EIC08';
        $data['oper_type'] = $data['oper_type'] ?? 'A';                    // A = new, M = modify
        // Zone code from resource
        $data['telecom_region'] = $resource['area_code'];
        $data['customer_type'] = 'residential';

        // Contact defaults from customer profile
        $data['contact_person'] = $data['contact_person'] ?? $contact['contact_person'] ?? null;
        $data['contact_no'] = $data['contact_no'] ?? $contact['contact_no'] ?? null;
        $data['contact_email'] = $data['contact_email'] ?? $contact['contact_email'] ?? null;

        // Customer code from auth context
        $data['customer_code'] = $this->customerCode();

        // Other defaults
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

        // Convert bandwidth to KB for consistent storage (BSS returns KB format)
        $bandwidthKb = null;
        if (!empty($data['bandwidth'])) {
            $bandwidthKb = $this->parseBandwidth($data['bandwidth']);
        }

        // Track total amount for auto-subscription decision
        $totalAmount = 0;
        $isManualSurvey = (bool) ($data['survey_is_manual'] ?? false);

        DB::transaction(function () use ($surveyOrderId, $data, $resource, $serviceNumber, $bandwidthKb, &$totalAmount, $isManualSurvey) {
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

            $survey = SurveyOrder::create([
                ...$data,
                'bandwidth' => $bandwidthKb,
                'completed_date' => now(),
                'with_device' => (bool) $data['with_device'],
                'device_id' => $deviceId,
                'device_offer_id' => $deviceOfferId,
                'device_voice_id' => $deviceVoiceId,
                'device_voice_offer_id' => $deviceVoiceOfferId,
                'service_number' => $serviceNumber,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => $isManualSurvey ? FFDServiceProvisionStatus::Waiting->value : FFDServiceProvisionStatus::Completed->value,
                'cable_length' => $resource['distance'] ?? null,
                'cable_type' => $cableType,
                'media_type' => $mediaType,
                'lat' => isset($resource['latitude']) ? round((float) $resource['latitude'], 8) : null,
                'long' => isset($resource['longitude']) ? round((float) $resource['longitude'], 8) : null,
                'area_code' => $areaCode,
                'area_name' => $areaName,
                'zone_code' => $zoneCode,
            ]);

            $profile = $this->getCustomerProfile();

            $requestData = [
                'service_number' => $serviceNumber,
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

            $totalAmount = $fees['total_amount'] + $deviceFee;

            $this->payment_service->createOrUpdatePayment([
                'customer_survey_order_id' => $survey->customer_survey_order_id,
                'service_number' => $survey->service_number,
                'subscription_fee' => $fees['subscription_fee'],
                'cable_charge' => $fees['cable_charge'],
                'device_fee' => $deviceFee,
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
            usleep(10000); // 10ms

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
