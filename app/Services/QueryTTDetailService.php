<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class QueryTTDetailService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function queryTTDetail(array $data): array
    {
        $xml = $this->buildRequestXml($data);
        $responseXml = $this->executeRequest($xml);
        return $this->parseResponseXml($responseXml);
    }

    protected function buildRequestXml(array $data): string
    {
        $requestor = $data['requestor'] ?? 1;
        $searchType = $data['search_type'] ?? 1;
        $searchValue = $data['search_value'];

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eth="http://www.example.org/EthioSPMInterfaceSheet/">
    <soapenv:Header/>
    <soapenv:Body>
        <eth:queryTTDetail>
            <requestor>{$requestor}</requestor>
            <searchType>{$searchType}</searchType>
            <searchValue>{$searchValue}</searchValue>
        </eth:queryTTDetail>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function executeRequest(string $xml): string
    {
        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->timeout(10)
            ->post($this->endpoint, $xml);

        if ($response->failed()) {
            throw new \RuntimeException('SOAP request failed: ' . $response->body());
        }

        return $response->body();
    }

    protected function parseResponseXml(string $xml): array
    {
        libxml_use_internal_errors(true);
        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        $namespaces = $parsed->getNamespaces(true);

        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? '');
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1'] ?? '');

        $responses = $parsed->xpath('//soapenv:Body/ns1:queryTTDetailResponse');
        if (empty($responses)) {
            throw new \Exception('queryTTDetailResponse not found in SOAP response');
        }

        $response = $responses[0];

        // Basic TT info
        $ttData = [];
        foreach ($response as $key => $value) {
            if ($key !== 'activityList' && $key !== 'ttResult') {
                $ttData[$key] = (string) $value;
            }
        }

        // TT Result
        $ttData['result_code'] = (string) ($response->ttResult->resultCode ?? '');
        $ttData['desc'] = (string) ($response->ttResult->desc ?? '');

        // Activities
        $activities = [];
        if (isset($response->activityList->activity)) {
            foreach ($response->activityList->activity as $activity) {
                $activities[] = [
                    'activity_name' => (string) $activity->activityName,
                    'tt_status' => (string) $activity->ttStatus,
                    'out_time' => (string) $activity->outTime,
                    'in_time' => (string) $activity->inTime,
                    'handler' => (string) $activity->handler,
                    'remarks' => (string) $activity->remarks,
                ];
            }
        }
        $ttData['activities'] = $activities;

        return $ttData;
    }
}
