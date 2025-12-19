<?php

namespace App\Services\Survey;

use App\Services\BaseApiService;
use App\Models\SurveyRequest;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\PaymentCalculatorService;
use App\Services\PaymentService;
use App\Services\ResourceService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

abstract class BaseSurveyService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function __construct(protected readonly PaymentService $payment_service) {}

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

            $data = [
                'business_code'               => 'CO064',
                'customer_type'               => 1,
                'customer_category'           => 1,
                'customer_subcategory'        => 1,
                'customer_level'              => 6,
                'customer_nationality'        => 1231,
                'customer_id_type'            => 2,
                'sub_order_business_code'     => 'CO015',
                'sub_order_external_sequence' => uniqid(),
                'service_number'              => '123457155', // or $survey->service_number
                'network_type'                => 4,
                'sub_type'                    => 0,
                'offering_id'                 => 1207609454,  // or $survey->main_offer_id
                'cable_length'                => 0,           // default for test
                'cable_type'                  => 0,           // default for test
                'customer_survey_order_id'    => $surveyOrderId
            ];


            $survey = SurveyRequest::create([
                ...$data,
                'customer_survey_order_id' => $surveyOrderId,
                'status' => FFDServiceProvisionStatus::Completed->value,
                'cable_length' => $resource['distance'] ?? null,
                'cable_type'   => $resource['cable_type'] ?? null,
                'lat'          => $resource['latitude'] ?? null,
                'long'         => $resource['longitude'] ?? null,
            ]);

            $calculator = app(PaymentCalculatorService::class);
            $fees = $calculator->calculateFees($survey, $validatedRequestData ?? null);

            $this->payment_service->createOrUpdatePayment([
                'customer_survey_order_id'       => $survey->customer_survey_order_id,
                'service_number'                 => $survey->service_number,
                'total_amount'                         => $fees['total_amount'],
                'labor_material_transport_cost'  => $fees['cable_charge'],
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
