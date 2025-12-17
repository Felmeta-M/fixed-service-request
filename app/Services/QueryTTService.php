<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class QueryTTService
{
    protected string $endpoint;

    public function __construct()
    {
        $this->endpoint = config('services.endpoint');
    }

    public function queryTT(array $data): array
    {
        $xml = $this->buildRequestXml($data);
        $responseXml = $this->executeRequest($xml);
        return $this->parseResponseXml($responseXml);
    }

    protected function buildRequestXml(array $data): string
    {
        $requestor = $data['requestor'] ?? 1;
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

        $responses = $parsed->xpath('//soapenv:Body/ns1:queryTTResponse');
        if (empty($responses)) {
            throw new \Exception('queryTTResponse not found in SOAP response');
        }

        $response = $responses[0];
        $ttList = [];

        if (isset($response->TTList->tt)) {
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

        return [
            'result_code' => (string) $response->resultCode,
            'desc' => (string) $response->desc,
            'tt_list' => $ttList,
        ];
    }
}
