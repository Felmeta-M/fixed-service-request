<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ConfirmFeedbackService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function confirmFeedback(array $data)
    {
        $xml = $this->buildRequestXml($data);
        $responseXml = $this->executeRequest($xml);
        $parsed = $this->parseConfirmFeedbackXml($responseXml);
        return $parsed;
    }

    protected function buildRequestXml(array $data): string
    {
        $requestor = $data['requestor'] ?? 1;
        $ttNo = $data['tt_no'];
        $resultCode = $data['result_code'];
        $desc = $data['desc'];

        return <<<XML
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

    protected function parseConfirmFeedbackXml(string $xml, bool $throwOnFailure = false)
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
            return ApiResponse::error("SOAP Fault: $message", 500);
        }

        // Find the response node
        $responseNodes = $parsed->xpath('//soapenv:Body/ns1:confirmFeedbackResponse');
        if (empty($responseNodes)) {
            return ApiResponse::error('confirmFeedbackResponse node missing in SOAP response', 500);
        }

        $response = $responseNodes[0];

        $resultCode = (string) ($response->resultCode ?? '');
        $desc = (string) ($response->desc ?? '');
        $requestor = (string) ($response->requestor ?? null);
        $success = $resultCode === '0';

        return ApiResponse::success([
            'success' => $success,
            'requestor' => $requestor,
            'result_code' => $resultCode ?: null,
            'desc' => $desc ?: '',
        ]);
    }
}
