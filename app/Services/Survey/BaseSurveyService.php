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
    ) {}

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

        $data['telecom_region'] = $resource['area_code'] ?? null;

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

        $xml = $this->buildXml($data, $resource);

        $response = $this->executeRequest($xml);

        return $this->parseResponse($data, $response, $resource);
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
        DB::transaction(function () use ($surveyOrderId, $data, $resource, $serviceNumber) {
            $survey = SurveyOrder::create([
                ...$data,
                'completed_date' => now(),
                'with_device' => (bool) $data['with_device'],
                'device_id' => $data['device_id'] ?? null,
                'device_voice_id' => $data['device_voice_id'] ?? null,
                'service_number' => $serviceNumber,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => $data['survey_is_manual'] ? FFDServiceProvisionStatus::Completed->value : FFDServiceProvisionStatus::Waiting->value,
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
            // For combo services, add both internet and voice device prices
            $deviceFee = 0;
            if ($survey->with_device) {
                // Internet/Data device fee
                if ($survey->device_id) {
                    $device = \App\Models\AvailableDevice::find($survey->device_id);
                    $deviceFee += $device ? (float) $device->price : 0;
                }

                // Voice device fee (for combo services)
                if ($survey->device_voice_id) {
                    $voiceDevice = \App\Models\AvailableDevice::find($survey->device_voice_id);
                    $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
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
