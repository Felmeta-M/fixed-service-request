<?php

namespace App\Services;

class QueryAvailableNumberService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function __construct(
        protected readonly ReserveNumberService $reserveNumberService,
    ) {}

    protected function endpoint(): string
    {
        return config('services.query_available_number.endpoint');
    }

    protected function getAvailableNumberServices(): string | bool
    {
        $data = [
            "pay_mode" => "1",
            "tele_type" => "4",
            "need_query_by_dept" => false,
            "res_cnt" => 10
        ];

        $numberList = $this->queryAvailableNumbers($data) ?? [];
        if (empty($numberList)) {
            return false;
        }

        $filtered = array_filter($numberList, fn($item) => $item['Level'] === "6");
        if (empty($filtered)) {
            return false;
        }

        $numberServices = array_column($filtered, 'ServiceNumber');

        foreach ($numberServices as $numberService) {
            $status = $this->reserveNumberService($numberService);
            if ($status === true) {
                return $numberService;
            }
        }

        return false;
    }

    public function queryAvailableNumbers(array $data): array
    {

        $xmlPayload = $this->buildXml($data);
        $xmlResponse = $this->executeRequest($xmlPayload);

        return  $this->parseResponse($xmlResponse);
    }

    protected function reserveNumberService(string $numberService): bool
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1029,
            'res_code' => $numberService,
        ];

        return $this->reserveNumberService->pick($data);
    }

    protected function releaseNumberService(string $numberService): bool
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1030,
            'res_code' => $numberService,
        ];

        return $this->reserveNumberService->unpick($data);
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
