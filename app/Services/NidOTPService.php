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
            $xmlRequest = $this->buildXml($payload);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml;charset=UTF-8',
            ])->timeout(30)->post(config('services.opt.endpoint'), $xmlRequest);

            return $this->parseResponse($response->body());
        } catch (Exception $e) {
            Log::error("NID Service Request Error: " . $e->getMessage());
            return $this->formatResponse(false, null, $e->getMessage());
        }
    }

    protected function buildXml(array $data)
    {
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');
        $credentials = config('services.otp');
        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <wsa:To>{$credentials['endpoint']}</wsa:To>
      <wsa:MessageID>urn:uuid:{$transactionId}</wsa:MessageID>
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
            <nid:clientSecret>{$credentials['clientSecret']}</nid:clientSecret>
            <nid:version>1.0</nid:version>
            <nid:requestTime>{$processTime}</nid:requestTime>
            <nid:env>{$credentials['env']}</nid:env>
            <nid:domainUri>{$credentials['domainUri']}</nid:domainUri>
            <nid:transactionID>{$transactionId}</nid:transactionID>
            <nid:individualId>{$data['individualId']}</nid:individualId>
            <nid:individualIdType>{$credentials['individualIdType']}</nid:individualIdType>
            <nid:otpChannel>{$credentials['otpChannel']}</nid:otpChannel>
         </nid:RequestDataReqBody>
      </nid:RequestDataReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }
    protected function parseResponse(?string $xml)
    {
        // If nothing came back from the server
        if (empty($xml)) {
            Log::warning("NID Service: Empty SOAP response received.");
            return $this->formatResponse(false, null, "No response from NID service.");
        }

        try {
            libxml_use_internal_errors(true); // prevent PHP from throwing XML warnings
            $xmlObject = new SimpleXMLElement($xml);

            $ns = $xmlObject->getNamespaces(true);
            if (!isset($ns['soapenv']) || !isset($ns['nid']) || !isset($ns['com'])) {
                Log::warning("NID Service: Missing namespaces in SOAP response.");
                return $this->formatResponse(false, null, "Invalid SOAP response format.");
            }

            $body = $xmlObject->children($ns['soapenv'])->Body ?? null;
            if (!$body) {
                Log::warning("NID Service: SOAP body missing.");
                return $this->formatResponse(false, null, "Invalid SOAP response: body missing.");
            }

            $responseMsg = $body->children($ns['nid'])->RequestDataRspMsg ?? null;
            if (!$responseMsg) {
                Log::warning("NID Service: Missing RequestDataRspMsg in SOAP body.");
                return $this->formatResponse(false, null, "Invalid SOAP response: message missing.");
            }

            $header = $responseMsg->children($ns['com'])->ResponseHeader ?? null;
            if (!$header) {
                Log::warning("NID Service: Missing ResponseHeader.");
                return $this->formatResponse(false, null, "Invalid SOAP response: header missing.");
            }

            $retCode = (string) $header->RetCode;
            $retMsg  = (string) $header->RetMsg;

            if ($retCode !== '0') {
                Log::info("NID Service: Non-success return code: {$retCode} - {$retMsg}");
                return $this->formatResponse(false, null, "NID Error: {$retMsg}");
            }

            $bodyData = $responseMsg->children($ns['nid'])->RequestDataRspBody->response ?? null;

            return $this->formatResponse(true, [
                'maskedMobile' => (string) ($bodyData->maskedMobile ?? ''),
                'maskedEmail'  => (string) ($bodyData->maskedEmail ?? ''),
            ]);
        } catch (\Throwable $e) {
            Log::error("NID Service parse error: " . $e->getMessage());
            return $this->formatResponse(false, null, "Failed to parse NID response.");
        }
    }
}
