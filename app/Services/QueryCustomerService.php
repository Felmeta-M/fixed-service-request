<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QueryCustomerService
{
    public function getCustomer(string $customerCode): array
    {
        $xml = $this->buildXml($customerCode);

        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xml, 'text/xml')->post(config('services.query_customer.url'));

        if ($response->failed()) {
            Log::error('Huawei BSS SOAP request failed', ['response' => $response->body()]);
            throw new \Exception('SOAP Request Failed');
        }

        return $this->parseResponse($response->body());
    }

    protected function buildXml(string $customerCode): string
    {
        $transactionId = now()->format('YmdHis') . rand(1000, 9999);
        $processTime = now()->format('YmdHis');
        $accessUser = config('services.query_customer.user');
        $accessPwd = config('services.query_customer.password');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:GetCustomerRequest>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>2002</com:Language>
            <com:ChannelId>61</com:ChannelId>
            <com:TechnicalChannelId>51</com:TechnicalChannelId>
            <com:AccessUser>{$accessUser}</com:AccessUser>
            <com:AccessPwd>{$accessPwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:GetCustomerBody>
            <com:CustomerCode>{$customerCode}</com:CustomerCode>
         </ser:GetCustomerBody>
      </ser:GetCustomerRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(string $xml): array
    {
        $xmlObj = simplexml_load_string($xml, null, 0, "http://schemas.xmlsoap.org/soap/envelope/");
        $body = $xmlObj->children('http://schemas.xmlsoap.org/soap/envelope/')->Body;
        $response = $body->children('http://oss.huawei.com/webservice/bss/services')->GetCustomerResponse;
        $responseBody = $response->GetCustomerBody;

        return json_decode(json_encode($responseBody), true);
    }
}
