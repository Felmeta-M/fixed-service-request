<?php

namespace App\Services\Survey;

use App\Services\BaseApiService;
use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\Payment\PaymentCalculatorService;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\ResourceService;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

abstract class BaseSurveyService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

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
            'latitude'  => $data['survey_address_info']['latitude'] ?? null,
        ];
        // $this->resourceCheck($data);
        $resource = self::decrypt($resource);
        $xml = $this->buildXml($data, $resource);
        $response = $this->executeRequest($xml);
        // Log::info($response);
        return $this->parseResponse($data, $response, $resource);
    }

    protected function resourceCheck(array $data): array
    {
        $response = app(ResourceService::class)->check([
            'bandwidth' => $data['bandwidth'] ?? null,
            'longitude' => $data['survey_address_info']['longitude'],
            'latitude'  => $data['survey_address_info']['latitude'],
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
                'with_device' => (bool)$data['with_device'],
                'device_id' => $data['device_id'] ?? null,
                'device_voice_id' => $data['device_voice_id'] ?? null,
                'service_number' => $serviceNumber,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => $data['survey_is_manual'] ? FFDServiceProvisionStatus::Waiting->value : FFDServiceProvisionStatus::Completed->value,
                'cable_length' => $resource['distance'] ?? null,
                'cable_type'   => $resource['cable_type'] ?? null,
                $data['lat']  = isset($resource['latitude'])
                    ? round((float) $resource['latitude'], 8)
                    : null,

                $data['long'] = isset($resource['longitude'])
                    ? round((float) $resource['longitude'], 8)
                    : null,
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
                'customer_survey_order_id'       => $survey->customer_survey_order_id,
                'service_number'                 => $survey->service_number,
                'subscription_fee' => $fees['subscription_fee'],
                'cable_charge'     => $fees['cable_charge'],
                'device_fee'      => $deviceFee,
                'total_amount'     => $totalAmount,
                'cable_charge'  => $fees['cable_charge'],
            ]);
        });
    }

    public static function decrypt(array $data): ?array
    {
        try {
            $decrypted = $data;
            // List of fields to decrypt
            $fieldsToDecrypt = ['neid', 'distance', 'cable_type', 'latitude', 'longitude'];

            foreach ($fieldsToDecrypt as $field) {
                if (isset($data[$field]) && !is_null($data[$field])) {
                    $decrypted[$field] = Crypt::decryptString($data[$field]);
                }
            }

            return $decrypted;
        } catch (\Exception $e) {
            Log::error('Decryption failed: ' . $e->getMessage());
            return null; // Or throw a custom exception if you prefer
        }
    }

    // parseBandwidth is inherited from BaseApiService

    /** Service-specific hooks */
    abstract protected function mainOfferId(): int;
    abstract protected function buildXml(array $data, array $resource): string;
    abstract protected function parseResponse(
        array $data,
        string $xml,
        array $resource
    );
}
