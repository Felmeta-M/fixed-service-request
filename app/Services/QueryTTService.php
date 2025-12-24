<?php

namespace App\Services;

use RuntimeException;

class QueryTTService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function queryTT(array $data)
    {
        $xml = $this->buildRequestXml($data);
        $responseXml = $this->executeRequest($xml);
        $parsed = $this->parseQueryTTResponseXml($responseXml);
        return $parsed;
    }

    protected function buildRequestXml(array $data): string
    {
        $requestor =  1;
        $accessNumber = $data['access_number'];

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eth="http://www.example.org/EthioSPMInterfaceSheet/">
    <soapenv:Header/>
    <soapenv:Body>
        <eth:queryTT>
            <requestor>{$requestor}</requestor>
            <accessNumber>{$accessNumber}</accessNumber>
        </eth:queryTT>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    public function parseQueryTTResponseXml(string $xml, bool $throwOnFailure = false)
    {
        libxml_use_internal_errors(true);

        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

        $namespaces = $parsed->getNamespaces(true);
        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? '');
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1'] ?? '');

        $responseNodes = $parsed->xpath('//soapenv:Body/ns1:queryTTResponse');
        if (empty($responseNodes)) {
            $data = [
                'success' => false,
                // 'result_code' => '1',
                'message' => 'query TTR esponse node missing',
                'tt_list' => [],
            ];

            if ($throwOnFailure) {
                throw new RuntimeException($data['desc']);
            }

            return ApiResponse::success($data);
        }

        $response = $responseNodes[0];
        $resultCode = (string) ($response->resultCode ?? '1');
        $desc = (string) ($response->desc ?? 'No data found');

        $ttList = [];
        if (!empty($response->TTList->tt)) {
            foreach ($response->TTList->tt as $tt) {
                $ttList[] = [
                    'tt_no' => (string) $tt->ttNo,
                    'cust_name' => (string) $tt->custName,
                    'acc_number' => (string) $tt->accNumber,
                    'trouble_title' => (string) $tt->troubleTitle,
                    'accept_time' => (string) $tt->acceptTime,
                    'trouble_reason' => (string) $tt->troubleReason,
                    'deadline' => (string) $tt->deadline,
                    'current_activity' => (string) $tt->currentActivity,
                    'handler' => (string) $tt->handler,
                    'tt_status' => (string) $tt->ttStatus,
                ];
            }
        }

        $success = $resultCode === '0';

        if ($throwOnFailure && !$success) {
            throw new RuntimeException("Query TT failed: $desc");
        }

        $data = [
            'success' => $success,
            // 'result_code' => $resultCode,
            'message' => $desc,
            'tt_list' => $ttList,
        ];

        return ApiResponse::success($data);
    }
}
