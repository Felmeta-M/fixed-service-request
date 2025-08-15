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
            ])->post(config('services.otp.endpoint'), $xmlRequest);

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

    public function parse(string $xml): array
    {
        try {
            $simpleXml = new SimpleXMLElement($xml);
            $namespaces = $simpleXml->getNamespaces(true);

            $body = $simpleXml->children($namespaces['soapenv'])->Body;
            if (!$body) {
                return $this->formatResponse(false, null, 'SOAP Body not found');
            }

            $rspMsg = $body->children($namespaces['nid'])->RequestDataRspMsg;
            if (!$rspMsg) {
                return $this->formatResponse(false, null, 'Response message not found');
            }

            $header = $rspMsg->children($namespaces['com'])->ResponseHeader;
            $bodyContent = $rspMsg->children($namespaces['nid'])->RequestDataRspBody;

            if (!$header || !$bodyContent) {
                return $this->formatResponse(false, null, 'Required XML nodes missing');
            }

            $data = [
                'transaction_id' => (string) ($header->TransactionId ?? ''),
                'ret_code'       => (string) ($header->RetCode ?? ''),
                'ret_msg'        => (string) ($header->RetMsg ?? ''),
                'id'             => (string) ($bodyContent->id ?? ''),
                'version'        => (string) ($bodyContent->version ?? ''),
                'response_time'  => (string) ($bodyContent->responseTime ?? ''),
                'transactionID'  => (string) ($bodyContent->transactionID ?? ''),
                'masked_mobile'  => (string) ($bodyContent->response->maskedMobile ?? ''),
                'masked_email'   => (string) ($bodyContent->response->maskedEmail ?? ''),
            ];

            return $this->formatResponse(true, $data);
        } catch (Exception $e) {
            return $this->formatResponse(false, null, $e->getMessage());
        }
    }
}
