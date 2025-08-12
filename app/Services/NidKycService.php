<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Exception;

class NidKycService
{
    protected function formatResponse(bool $success, $data = null, $error = null)
    {
        return [
            'success' => $success,
            'data'    => $data,
            'error'   => $error,
        ];
    }

    public function requestData(array $payload)
    {
        try {
            $xmlRequest = $this->buildXml($payload);
            \Log::info($xmlRequest);
            return;
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml;charset=UTF-8',
            ])->post(config('services.kyc.endpoint'), $xmlRequest);

            $parsedData = $this->parseResponse($response->body());

            return $this->formatResponse(true, $parsedData);
        } catch (Exception $e) {
            Log::error("NID Service Request Error: " . $e->getMessage());

            return $this->formatResponse(false, null, $e->getMessage());
        }
    }

    public function buildXml(array $data): string
    {
        $transactionId = Str::uuid();
        $processTime = now()->format('YmdHis');
        $requestTime = now()->format('YmdHis');
        $credentials = config('services.kyc');
        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <wsa:To>{$credentials['endpoint']}</wsa:To>
      <wsa:MessageID>urn:uuid:{$transactionId}</wsa:MessageID>
      <wsa:Action>GetDataKyc</wsa:Action>
   </soapenv:Header>
   <soapenv:Body>
      <nid:GetDataKycReqMsg xmlns:com="http://www.huawei.com/bss/soaif/interface/common/" xmlns:nid="http://www.huawei.com/bss/soaif/interface/NID/">
         <com:RequestHeader>
            <com:Version>{$credentials['version']}</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:SequenceId>1</com:SequenceId>
            <com:Channel>{$credentials['channel']}</com:Channel>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
            <com:AccessPassword>{$credentials['access_password']}</com:AccessPassword>
            <com:OperatorId>{$credentials['operator_id']}</com:OperatorId>
         </com:RequestHeader>
         <nid:GetDataKycReqBody>
            <nid:id>{$credentials['client_id']}</nid:id>
            <nid:clientSecret>{$credentials['client_secret']}</nid:clientSecret>
            <nid:requestTime>{$requestTime}</nid:requestTime>
            <nid:env>{$credentials['env']}</nid:env>
            <nid:domainUri>{$credentials['domain_uri']}</nid:domainUri>
            <nid:transactionID>{$data['transaction_id']}</nid:transactionID>
            <nid:requestedAuth>
               <nid:otp>true</nid:otp>
               <nid:demo>false</nid:demo>
               <nid:bio>false</nid:bio>
            </nid:requestedAuth>
            <nid:consentObtained>true</nid:consentObtained>
            <nid:individualId>{$data['individual_id']}</nid:individualId>
            <nid:individualIdType>'FCN'</nid:individualIdType>
            <nid:request>
               <nid:timestamp>{$requestTime}</nid:timestamp>
               <nid:otp>{$data['otp_value']}</nid:otp>
            </nid:request>
         </nid:GetDataKycReqBody>
      </nid:GetDataKycReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    public function parseResponse(string $xmlResponse)
    {
        try {
            $xml = new SimpleXMLElement($xmlResponse);
            $namespaces = $xml->getNamespaces(true);

            // Navigate to RetCode & RetMsg
            $retCode = (string) $xml->children($namespaces['soapenv'])
                ->Body
                ->children($namespaces['nid'])
                ->GetDataKycRspMsg
                ->children($namespaces['com'])
                ->ResponseHeader
                ->RetCode;

            $retMsg = (string) $xml->children($namespaces['soapenv'])
                ->Body
                ->children($namespaces['nid'])
                ->GetDataKycRspMsg
                ->children($namespaces['com'])
                ->ResponseHeader
                ->RetMsg;

            return [
                'success' => $retCode === '0',
                'code' => $retCode,
                'message' => $retMsg,
                'raw' => $xmlResponse,
            ];
        } catch (Exception $e) {
            Log::error("XML Parsing Error: {$e->getMessage()}");
            return [
                'success' => false,
                'error' => 'Invalid XML format',
            ];
        }
    }
}
