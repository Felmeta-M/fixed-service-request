<?php

namespace App\Services;

class QueryAvailableNumberService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 5;

    protected function endpoint(): string
    {
        return config('services.query_available_number.endpoint');
    }

    public function queryAvailableNumbers(array $data): array
    {

        $xmlPayload = $this->buildXml($data);
        $xmlResponse = $this->executeRequest($xmlPayload);

        return  $this->parseResponse($xmlResponse);
    }

    /**
     * Build SOAP XML for querying available numbers.
     */
    protected function buildXml(array $data): string
    {
        $transactionId = uniqid();
        $accessUser = config('services.query_available_number.user');
        $accessPwd = config('services.query_available_number.password');
        $channelId = config('services.query_available_number.channel_id');
        $techChannelId = config('services.query_available_number.tech_channel_id');
        $needQueryByDeptStr = $data['need_query_by_dept'] ? 'true' : 'false';

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QueryAvailableNumberReqMsg>
         <ser:RequestHeader>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>{$channelId}</com:ChannelId>
            <com:TechnicalChannelId>{$techChannelId}</com:TechnicalChannelId>
            <com:AccessUser>{$accessUser}</com:AccessUser>
            <com:AccessPwd>{$accessPwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:PayMode>{$data['pay_mode']}</ser:PayMode>
         <ser:TeleType>{$data['tele_type']}</ser:TeleType>
         <ser:ResCnt>{$data['res_cnt']}</ser:ResCnt>
         <ser:NeedQueryByDept>{$needQueryByDeptStr}</ser:NeedQueryByDept>
      </ser:QueryAvailableNumberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parses the SOAP XML response and returns the available numbers as an array.
     */
    protected function parseResponse(string $xml): array
    {
        $soap = simplexml_load_string($xml);

        if ($soap === false) {
            return [];
        }

        $body = $soap->children('http://schemas.xmlsoap.org/soap/envelope/')->Body;

        $response = $body->children('http://oss.huawei.com/webservice/bss/services')->QueryAvailableNumberRspMsg;

        $header = $response->ResponseHeader;
        $retCode = (string) $header->children('http://www.huawei.com/bss/soaif/interface/common/')->RetCode;

        if ($retCode !== '0') {
            return [];
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
        return $numberList;
    }
}
