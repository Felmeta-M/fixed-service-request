<?php

namespace App\Services\Survey;

use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\Payment\PaymentCalculatorService;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\ResourceService;
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
        protected readonly QueryAvailableNumberService $queryAvailableNumberService,
        protected readonly ReserveNumberService $reserveNumberService,
    ) {
    }

    protected function endpoint(): string
    {
        return config('services.survey.endpoint');
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
        AppLogger::api()->info('Survey XML', [
            'xml' => $xml,
        ]);

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
        $data['oper_type'] = $data['oper_type'] ?? 'A';                    // A = new
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

        DB::transaction(function () use ($surveyOrderId, $data, $resource, $serviceNumber, $bandwidthKb) {
            $survey = SurveyOrder::create([
                ...$data,
                'bandwidth' => $bandwidthKb, // Save as KB for consistency with BSS responses
                'completed_date' => now(),
                'with_device' => (bool) $data['with_device'],
                'device_id' => $data['device_id'] ?? null,
                'device_voice_id' => $data['device_voice_id'] ?? null,
                'service_number' => $serviceNumber,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => $data['survey_is_manual'] ? FFDServiceProvisionStatus::Waiting->value : FFDServiceProvisionStatus::Completed->value,
                'cable_length' => $resource['distance'] ?? null,
                'cable_type' => $resource['cable_type'] ?? null,
                'lat' => isset($resource['latitude']) ? round((float) $resource['latitude'], 8) : null,
                'long' => isset($resource['longitude']) ? round((float) $resource['longitude'], 8) : null,
            ]);

            // Use dynamic customer BSS classification from BaseApiService helper
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

            // Calculate device fee from selected device prices
            // Device storage logic:
            // - Voice-only (1207609454): device_id contains voice device
            // - Broadband (1457567289): device_id contains internet device
            // - Combo (180427974): device_id contains internet device, device_voice_id contains voice device
            $deviceFee = 0;
            if ($survey->with_device) {
                $mainOfferId = (int) $survey->main_offer_id;
                $isCombo = $mainOfferId === 180427974;
                $isVoiceOnly = $mainOfferId === 1207609454;

                if ($isCombo) {
                    // Combo service: device_id is internet, device_voice_id is voice
                    if ($survey->device_id) {
                        $internetDevice = \App\Models\AvailableDevice::find($survey->device_id);
                        $deviceFee += $internetDevice ? (float) $internetDevice->price : 0;
                    }
                    if ($survey->device_voice_id) {
                        $voiceDevice = \App\Models\AvailableDevice::find($survey->device_voice_id);
                        $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
                    }
                } elseif ($isVoiceOnly) {
                    // Voice-only service: device_id contains voice device
                    if ($survey->device_id) {
                        $voiceDevice = \App\Models\AvailableDevice::find($survey->device_id);
                        $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
                    }
                } else {
                    // Broadband service: device_id contains internet device
                    if ($survey->device_id) {
                        $internetDevice = \App\Models\AvailableDevice::find($survey->device_id);
                        $deviceFee += $internetDevice ? (float) $internetDevice->price : 0;
                    }
                }
            }

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

        // Validate and decrypt all critical fields
        foreach ($criticalFields as $field) {
            if (isset($data[$field]) && !is_null($data[$field]) && $data[$field] !== '') {
                try {
                    $decrypted[$field] = Crypt::decryptString($data[$field]);
                } catch (\Exception $e) {
                    // Invalid or tampered encrypted data - stop processing immediately
                    AppLogger::api()->error('Failed to decrypt critical resource field - possible tampering detected', [
                        'field' => $field,
                        'operation' => 'decrypt_resource_fields',
                        'error' => $e->getMessage(),
                    ]);
                    return null;
                }
            } else {
                // Critical field is missing - stop processing
                AppLogger::api()->error('Critical resource field is missing', [
                    'field' => $field,
                    'operation' => 'decrypt_resource_fields',
                ]);
                return null;
            }
        }

        return $decrypted;
    }

    // parseBandwidth is inherited from BaseApiService

    /**
     * Format coordinate value for XML (longitude/latitude)
     * Ensures the value is properly formatted as a numeric string
     * 
     * @param string|null $coordinate The coordinate value (decrypted)
     * @return string Formatted coordinate value
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

    /** Service-specific hooks */
    abstract protected function mainOfferId(): int;
    abstract protected function buildXml(array $data, array $resource): string;
    abstract protected function parseResponse(
        array $data,
        string $xml,
        array $resource
    );
}
