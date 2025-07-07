<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class QueryAvailableNumberService
{
    /**
     * Sends a SOAP request to query available numbers.
     */
    public function queryAvailableNumbers(int $payMode = 1, int $teleType = 21, bool $needQueryByDept = false): array
    {
        $xml = $this->buildXmlQueryAvailableNumbers($payMode, $teleType, $needQueryByDept);

        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xml, 'text/xml')->post(config('services.query_available_number.url'));

        if ($response->failed()) {
            Log::error('Huawei BSS QueryAvailableNumber SOAP request failed', [
                'xml' => $xml,
                'response' => $response->body(),
            ]);

            throw new \Exception('SOAP Request Failed');
        }

        return $this->parseAvailableNumberResponse($response->body());
    }

    /**
     * Build SOAP XML for querying available numbers.
     */
    protected function buildXmlQueryAvailableNumbers(int $payMode, int $teleType, bool $needQueryByDept): string
    {
        $transactionId = (string) Str::uuid();
        $accessUser = config('services.query_available_number.user');
        $accessPwd = config('services.query_available_number.password');
        $needQueryByDeptStr = $needQueryByDept ? 'true' : 'false';

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QueryAvailableNumberReqMsg>
         <ser:RequestHeader>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>59</com:ChannelId>
            <com:TechnicalChannelId>59</com:TechnicalChannelId>
            <com:AccessUser>{$accessUser}</com:AccessUser>
            <com:AccessPwd>{$accessPwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:PayMode>{$payMode}</ser:PayMode>
         <ser:TeleType>{$teleType}</ser:TeleType>
         <ser:NeedQueryByDept>{$needQueryByDeptStr}</ser:NeedQueryByDept>
      </ser:QueryAvailableNumberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parses the SOAP XML response and returns the available numbers as an array.
     */
    protected function parseAvailableNumberResponse(string $xml): array
    {
        $soap = simplexml_load_string($xml);
        $body = $soap->children('http://schemas.xmlsoap.org/soap/envelope/')->Body;

        $response = $body->children('http://oss.huawei.com/webservice/bss/services')->QueryAvailableNumberRspMsg;

        $header = $response->ResponseHeader;
        $retCode = (string) $header->children('http://www.huawei.com/bss/soaif/interface/common/')->RetCode;

        if ($retCode !== '0') {
            throw new \Exception('Huawei API returned error code: ' . $retCode);
        }

        $numberList = [];
        foreach ($response->AvailableNumberList->AvailableNumber ?? [] as $number) {
            $numberList[] = [
                'ServiceNumber' => (string) $number->ServiceNumber,
                'ItemCode'      => (string) $number->ItemCode,
                'ResDeptId'     => (string) $number->ResDeptId,
                'PayMode'       => (string) $number->PayMode,
                'TeleType'      => (string) $number->TeleType,
                'Level'         => (string) $number->Level,
            ];
        }

        return [
            'count' => count($numberList),
            'numbers' => $numberList,
        ];
    }
}
