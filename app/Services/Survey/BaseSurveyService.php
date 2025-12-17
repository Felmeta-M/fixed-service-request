<?php

namespace App\Services\Survey;

use App\Services\BaseApiService;
use App\Models\SurveyRequest;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\ResourceService;
use RuntimeException;

abstract class BaseSurveyService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

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
        SurveyRequest::create([
            ...$data,
            'customer_survey_order_id' => $surveyOrderId,
            'status' => FFDServiceProvisionStatus::Completed->value,
            'cable_length' => $resource['distance'] ?? null,
            'cable_type'   => $resource['cable_type'] ?? null,
            'lat'          => $resource['latitude'] ?? null,
            'long'         => $resource['longitude'] ?? null,
        ]);
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
