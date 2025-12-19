<?php

namespace App\Services\Survey;

use App\Services\BaseApiService;
use App\Models\SurveyRequest;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\PaymentCalculatorService;
use App\Services\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\ResourceService;
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
        $resource = $this->resourceCheck($data);

        $xml = $this->buildXml($data, $resource);
        $response = $this->executeRequest($xml);

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
        array $resource
    ): void {

        DB::transaction(function () use ($surveyOrderId, $data, $resource) {

            $survey = SurveyRequest::create([
                ...$data,
                'service_number' => $data['service_number'] ?? $this->serviceNumber,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => FFDServiceProvisionStatus::Completed->value,
                'cable_length' => $resource['distance'] ?? null,
                'cable_type'   => $resource['cable_type'] ?? null,
                'lat'          => $resource['latitude'] ?? null,
                'long'         => $resource['longitude'] ?? null,
            ]);


            $requestData = [
                'service_number' => $data['service_number'] ?? $this->serviceNumber,
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

            $this->payment_service->createOrUpdatePayment([
                'customer_survey_order_id'       => $survey->customer_survey_order_id,
                'service_number'                 => $survey->service_number,
                'subscription_fee' => $fees['subscription_fee'],
                'cable_charge'     => $fees['cable_charge'],
                'device_fee'      => $data['device_fee'] ?? 200,
                'total_amount'     => $fees['total_amount'],
                'cable_charge'  => $fees['cable_charge'],
            ]);
        });
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
