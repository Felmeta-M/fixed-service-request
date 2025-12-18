<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class QueryTTDetailService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function queryTTDetail(array $data)
    {
        $xml = $this->buildRequestXml($data);
        $responseXml = $this->executeRequest($xml);
        $parsed = $this->parseQueryTTDetailXml($responseXml);
        return $parsed;
    }

    protected function buildRequestXml(array $data): string
    {
        $requestor = $data['requestor'] ?? 1;
        $searchType = $data['search_type'] ?? 1;
        $searchValue = $data['search'];

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

    public function parseQueryTTDetailXml(string $xml, bool $throwOnFailure = false)
    {
        libxml_use_internal_errors(true);

        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

        $namespaces = $parsed->getNamespaces(true);
        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? '');
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1'] ?? '');

        // Handle SOAP Fault
        $faultNodes = $parsed->xpath('//soapenv:Body/soapenv:Fault');
        if (!empty($faultNodes)) {
            $fault = $faultNodes[0];
            $message = (string) ($fault->faultstring ?? 'Unknown SOAP Fault');
            if ($throwOnFailure) {
                throw new RuntimeException("SOAP Fault: $message");
            }
            return ApiResponse::error($message, 500);
        }

        $responseNodes = $parsed->xpath('//soapenv:Body/ns1:queryTTDetailResponse');
        if (empty($responseNodes)) {
            $msg = 'queryTTDetailResponse node missing in SOAP response';
            if ($throwOnFailure) {
                throw new RuntimeException($msg);
            }
            return ApiResponse::error($msg, 500);
        }

        $response = $responseNodes[0];

        // Basic TT info
        $ttData = [];
        foreach ($response as $key => $value) {
            if (!in_array($key, ['activityList', 'ttResult'])) {
                $ttData[$key] = (string) $value;
            }
        }

        // TT Result
        $resultCode = (string) ($response->ttResult->resultCode ?? '1');
        $desc = (string) ($response->ttResult->desc ?? 'Unknown error');
        $success = $resultCode === '0';

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

        $data = array_merge([
            'success' => $success,
            'result_code' => $resultCode,
            'desc' => $desc,
        ], $ttData);

        // Optionally throw exception
        if ($throwOnFailure && !$success) {
            throw new RuntimeException("Query TT Detail failed: $desc");
        }

        return ApiResponse::success($data);
    }
}
