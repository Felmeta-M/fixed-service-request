<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ConfirmFeedbackService
{
    protected string $endpoint;

    public function __construct()
    {
        $this->endpoint = config('services.ethio_spm.endpoint');
    }

    public function confirmFeedback(array $data): array
    {
        $xml = $this->buildRequestXml($data);
        $responseXml = $this->executeRequest($xml);
        return $this->parseResponseXml($responseXml);
    }

    protected function buildRequestXml(array $data): string
    {
        $requestor = $data['requestor'] ?? 1;
        $ttNo = $data['tt_no'];
        $resultCode = $data['result_code'];
        $desc = htmlspecialchars($data['desc'], ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eth="http://www.example.org/EthioSPMInterfaceSheet/">
    <soapenv:Header/>
    <soapenv:Body>
        <eth:confirmFeedback>
            <requestor>{$requestor}</requestor>
            <ttNo>{$ttNo}</ttNo>
            <resultCode>{$resultCode}</resultCode>
            <desc>{$desc}</desc>
        </eth:confirmFeedback>
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

        $responses = $parsed->xpath('//soapenv:Body/ns1:confirmFeedbackResponse');
        if (empty($responses)) {
            throw new \Exception('confirmFeedbackResponse not found in SOAP response');
        }

        $response = $responses[0];

        return [
            'requestor' => (string) $response->requestor,
            'result_code' => (string) $response->resultCode,
            'desc' => (string) $response->desc,
        ];
    }
}
