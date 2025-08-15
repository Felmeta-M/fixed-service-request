<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use SimpleXMLElement;
use Exception;

class NidOtpService
{
    protected function formatResponse(bool $success,  $data = null,  $error = null)
    {
        return [
            'success' => $success,
            'data' => $data,
            'error' => $error
        ];
    }

    public function requestData(array $payload)
    {
        try {
            $xml = $this->buildXml($payload);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->send('POST', config('services.otp.endpoint'), [
                'body' => $xml,
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Send OTP request Failed'
                ], 500);
            }

            if ($response->successful()) {
                return $this->parseResponse($response->body());
            }
        } catch (Exception $e) {
            Log::error("NID OTP Request Error: " . $e->getMessage());
            return $this->formatResponse(false, null, $e->getMessage());
        }
    }

    protected function buildXml(array $data)
    {
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');
        $credentials = config('services.otp');
        $transactionId = $data['transaction_id'] ?? $this->generateTransactionId();

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <wsa:To>{$credentials['endpoint']}</wsa:To>
      <wsa:MessageID>urn:uuid:{$this->uuid()}</wsa:MessageID>
      <wsa:Action>RequestData</wsa:Action>
   </soapenv:Header>
   <soapenv:Body>
      <nid:RequestDataReqMsg xmlns:com="http://www.huawei.com/bss/soaif/interface/common/" xmlns:nid="http://www.huawei.com/bss/soaif/interface/NID/">
         <com:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:SequenceId>1</com:SequenceId>
            <com:Language>{$credentials['language']}</com:Language>
            <com:Channel>{$credentials['channel']}</com:Channel>
            <com:TenantID>{$credentials['tenant_id']}</com:TenantID>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
            <com:AccessPassword>{$credentials['access_password']}</com:AccessPassword>
            <com:OperatorId>{$credentials['operator_id']}</com:OperatorId>
         </com:RequestHeader>
         <nid:RequestDataReqBody>
            <nid:id>{$credentials['id']}</nid:id>
            <nid:clientSecret>{$credentials['client_secret']}</nid:clientSecret>
            <nid:version>1.0</nid:version>
            <nid:requestTime>{$processTime}</nid:requestTime>
            <nid:env>{$credentials['env']}</nid:env>
            <nid:domainUri>{$credentials['domain_uri']}</nid:domainUri>
            <nid:transactionID>{$transactionId}</nid:transactionID>
            <nid:individualId>{$data['individual_id']}</nid:individualId>
            <nid:individualIdType>{$credentials['individual_id_type']}</nid:individualIdType>
            <nid:otpChannel>{$credentials['otp_channel']}</nid:otpChannel>
         </nid:RequestDataReqBody>
      </nid:RequestDataReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    public function parseResponse(string $xml): array
    {
        $xmlObject = simplexml_load_string($xml);

        // Get namespaces from root (only soapenv exists here)
        $rootNamespaces = $xmlObject->getNamespaces(true);

        // Navigate to Body
        $body = $xmlObject->children($rootNamespaces['soapenv'])->Body;

        // Now get namespaces from the Body (nid + com are declared here)
        $bodyNamespaces = $body->getNamespaces(true);

        // Access the main response node
        $response = $body->children($bodyNamespaces['nid'])->RequestDataRspMsg;

        // Extract header
        $header = $response->children($bodyNamespaces['com'])->ResponseHeader;
        $headerData = $header->children($bodyNamespaces['com']);

        $retCode = (string) $headerData->RetCode;
        $retMsg  = (string) $headerData->RetMsg;

        // If fail
        if ($retCode !== '0') {
            return [
                'success'  => false,
                'ret_code' => $retCode,
                'ret_msg'  => $retMsg,
            ];
        }

        // Extract body
        $bodyData = $response->children($bodyNamespaces['nid'])->RequestDataRspBody;
        $responseFields = $bodyData->children($bodyNamespaces['nid'])->response->children($bodyNamespaces['nid']);

        return [
            'id'             => (string) $bodyData->children($bodyNamespaces['nid'])->id ?? '',
            'version'        => (string) $bodyData->children($bodyNamespaces['nid'])->version ?? '',
            'response_time'  => (string) $bodyData->children($bodyNamespaces['nid'])->responseTime ?? '',
            'transaction_id' => (string) $bodyData->children($bodyNamespaces['nid'])->transactionID ?? '',
            'masked_mobile'  => (string) $responseFields->maskedMobile ?? '',
            'masked_email'   => (string) $responseFields->maskedEmail ?? '',
            'ret_code'       => $retCode,
            'ret_msg'        => $retMsg,
        ];
    }

    /**
     * Generate a UUID v4 for MessageID.
     */
    protected function uuid(): string
    {
        return (string) \Str::uuid();
    }

    /**
     * Generate a transaction ID (could be UUID or something else unique).
     */
    protected function generateTransactionId(): string
    {
        return (string) \Str::uuid();
    }
}
