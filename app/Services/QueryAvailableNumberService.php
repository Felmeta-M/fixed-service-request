<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

    public function getAvailableNumberServices(
        ?int $resCnt = 10000,
        ?string $deptId = null
    ): string|bool {
        $data = [
            'pay_mode' => '1',
            'tele_type' => '4',
            'need_query_by_dept' => true,
            'res_cnt' => $resCnt,
            'dept_id' => $deptId ?? '1766044689199549668',
        ];

        $numberList = $this->queryAvailableNumbers($data);
        if (empty($numberList)) {
            return false;
        }

        // Extract only level 6 service numbers (single pass)
        $serviceNumbers = [];
        foreach ($numberList as $item) {
            if (($item['Level'] ?? null) === '6' && !empty($item['ServiceNumber'])) {
                $serviceNumbers[] = $item['ServiceNumber'];
            }
        }

        if (empty($serviceNumbers)) {
            return false;
        }

        // Fetch existing service numbers in ONE query
        $existingMap = DB::table('survey_requests')
            ->whereIn('service_number', $serviceNumbers)
            ->pluck('service_number')
            ->flip();

        // Return first available number
        foreach ($serviceNumbers as $numberService) {
            if (!isset($existingMap[$numberService])) {
                return $numberService;
            }
        }

        return false;
    }



    public function queryAvailableNumbers(array $data): array
    {
        $xmlPayload = $this->buildXml($data);
        $xmlResponse = $this->executeRequest($xmlPayload);
        Log::info($xmlResponse);
        return  $this->parseResponse($xmlResponse);
    }

    public function reserveNumberService(string $numberService): bool
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1029,
            'res_code' => $numberService,
        ];

        return $this->reserveNumberService->pick($data);
    }

    public function releaseNumberService(string $numberService): bool
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1030,
            'res_code' => $numberService,
        ];

        return $this->reserveNumberService->unpick($data);
    }

    protected function buildXml(array $data): string
    {
        //         $transactionId = uniqid();
        //         $processTime = now()->format('YmdHis');
        //         $version = $data['version'] ?? '1';
        //         $language = $data['language'] ?? '2003';
        //         $tenantId = config('services.query_available_number.tenant_id');

        //         $accessUser = config('services.query_available_number.user');
        //         $accessPwd = config('services.query_available_number.password');
        //         $channelId = config('services.query_available_number.channel_id');
        //         $techChannelId = config('services.query_available_number.tech_channel_id');

        //         $needQueryByDeptStr = $data['need_query_by_dept'] ? 'true' : 'false';
        //         $deptId = '1766044689199549668'; //$data['dept_id'];

        //         $additionalProperty = <<<XML
        // <ser:AdditionalProperty>
        //     <com:Code>dept_id</com:Code>
        //     <com:Value>{$deptId}</com:Value>
        // </ser:AdditionalProperty>
        // XML;

        //         return <<<XML
        // <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
        //    <soapenv:Header/>
        //    <soapenv:Body>
        //       <ser:QueryAvailableNumberReqMsg>
        //          <ser:RequestHeader>
        //             <com:Version>{$version}</com:Version>
        //             <com:TransactionId>{$transactionId}</com:TransactionId>
        //             <com:ProcessTime>{$processTime}</com:ProcessTime>
        //             <com:Language>{$language}</com:Language>
        //             <com:ChannelId>{$channelId}</com:ChannelId>
        //             <com:TechnicalChannelId>{$techChannelId}</com:TechnicalChannelId>
        //             <com:TenantId>{$tenantId}</com:TenantId>
        //             <com:AccessUser>{$accessUser}</com:AccessUser>
        //             <com:AccessPwd>{$accessPwd}</com:AccessPwd>
        //          </ser:RequestHeader>
        //          <ser:PayMode>{$data['pay_mode']}</ser:PayMode>
        //          <ser:TeleType>{$data['tele_type']}</ser:TeleType>
        //          <ser:ResCnt>{$data['res_cnt']}</ser:ResCnt>
        //          <ser:NeedQueryByDept>{$needQueryByDeptStr}</ser:NeedQueryByDept>
        //          {$additionalProperty}
        //       </ser:QueryAvailableNumberReqMsg>
        //    </soapenv:Body>
        // </soapenv:Envelope>
        // XML;

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QueryAvailableNumberReqMsg>
         <ser:RequestHeader>
            <!--Optional:-->
            <com:Version>1</com:Version>
            <com:TransactionId>0703582086</com:TransactionId>
            <com:ProcessTime>20211215110502</com:ProcessTime>
            <com:Language>2003</com:Language>
            <com:ChannelId>35</com:ChannelId>
            <com:TechnicalChannelId>51</com:TechnicalChannelId>
            <com:TenantId>101</com:TenantId>
            <com:AccessUser>ecaf</com:AccessUser>
            <com:AccessPwd>REDACTED_PASSWORD</com:AccessPwd>
       
         </ser:RequestHeader>
         <!--Optional:-->
         <ser:PayMode>1</ser:PayMode>
         <!--Optional:-->
         <ser:TeleType>4</ser:TeleType>
         <!--Optional:-->
         <ser:NeedQueryByDept>false</ser:NeedQueryByDept>
         <ser:ResCnt>100</ser:ResCnt>
         <ser:AdditionalProperty>
            <com:Code>dept_id</com:Code>
            <com:Value>1766044689199549668</com:Value>
         </ser:AdditionalProperty>
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
