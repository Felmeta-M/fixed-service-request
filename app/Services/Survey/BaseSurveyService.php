<?php

namespace App\Services\Survey;

use App\Services\BaseApiService;
use App\Models\SurveyRequest;
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

    protected function transactionId(): string
    {
        return now()->format('YmdHis');
    }

    protected function processTime(): string
    {
        return now()->format('YmdHis');
    }

    /** Same template method as Subscription */
    final public function create(array $data)
    {
        $resource = [
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
        Log::info('Persisting survey with Order ID: ', ['service_number' => $data['service_number'] ?? $this->serviceNumber ?? null]);

        DB::transaction(function () use ($surveyOrderId, $data, $resource) {
            $survey = SurveyRequest::create([
                ...$data,
                'with_device' => (bool)$data['with_device'],
                'service_number' => $data['service_number'] ?? $this->serviceNumber ?? null,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => FFDServiceProvisionStatus::Completed->value,
                'cable_length' => $resource['distance'] ?? null,
                'cable_type'   => $resource['cable_type'] ?? null,
                $data['lat']  = isset($resource['latitude'])
                    ? round((float) $resource['latitude'], 8)
                    : null,

                $data['long'] = isset($resource['longitude'])
                    ? round((float) $resource['longitude'], 8)
                    : null,
            ]);

            //reserve the number
            // $this->reserveNumberService($data['service_number'] ?? $this->serviceNumber); 

            $requestData = [
                'service_number' => $data['service_number'] ?? $this->serviceNumber ?? null,
                'offering_id' => $survey->main_offer_id,
                'network_type' => 4, // Fixed network
                'sub_type' => 0,
                'customer_type' => 1,
                'customer_category' => 1,
                'customer_subcategory' => 1,
                'customer_level' => 6,
                'customer_nationality' => 1231,
                'customer_id_type' => 2,
            ];

            $calculator = app(PaymentCalculatorService::class);
            $fees = $calculator->calculateFees($survey, $requestData);
            //TODO: device fee from one-off fee service
            $deviceFee =  $survey->with_device ?  200 : 0;
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
            $fieldsToDecrypt = ['distance', 'cable_type', 'latitude', 'longitude'];

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

    /** Service-specific hooks */
    abstract protected function mainOfferId(): int;
    abstract protected function buildXml(array $data, array $resource): string;
    abstract protected function parseResponse(
        array $data,
        string $xml,
        array $resource
    );
}
