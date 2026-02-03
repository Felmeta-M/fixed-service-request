<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class QueryAvailableNumberService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 100;

    public function __construct(
        protected readonly ReserveNumberService $reserveNumberService,
    ) {
    }

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    /**
     * Get an available service number and reserve it.
     * 
     * @param string $deptId Department ID for querying numbers
     * @param int|null $resCnt Number of results to fetch (default: 100)
     * @param string $level Number level filter (default: '6')
     * @return string|false Reserved service number or false on failure
     */
    public function getAvailableNumberServices(string $deptId, ?int $resCnt = 100, string $level = '6'): string|false
    {
        $data = [
            'pay_mode' => '1',
            'tele_type' => '4',
            'need_query_by_dept' => false,
            'res_cnt' => $resCnt,
            'dept_id' => $deptId,
        ];

        try {
            $numberList = $this->queryAvailableNumbers($data);

            if (empty($numberList)) {
                AppLogger::api()->warning('No available numbers returned', [
                    'dept_id' => $deptId,
                    'res_cnt' => $resCnt,
                ]);
                return false;
            }

            // Filter by level
            $filtered = array_filter($numberList, fn($item) => $item['Level'] === $level);

            if (empty($filtered)) {
                AppLogger::api()->warning('No numbers with required level', [
                    'dept_id' => $deptId,
                    'level' => $level,
                    'total_numbers' => count($numberList),
                ]);
                return false;
            }

            // Try to reserve each number until one succeeds
            foreach ($filtered as $number) {
                $serviceNumber = $number['ServiceNumber'];

                if ($this->reserveNumberService($serviceNumber)) {
                    AppLogger::api()->info('Service number reserved successfully', [
                        'service_number' => $serviceNumber,
                        'dept_id' => $deptId,
                    ]);
                    return $serviceNumber;
                }

                AppLogger::api()->debug('Failed to reserve number, trying next', [
                    'service_number' => $serviceNumber,
                ]);
            }

            AppLogger::api()->error('All available numbers failed to reserve', [
                'dept_id' => $deptId,
                'attempted_count' => count($filtered),
            ]);

            return false;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Query available numbers failed', [
                'dept_id' => $deptId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Query available numbers from BSS.
     */
    public function queryAvailableNumbers(array $data): array
    {
        $xmlPayload = $this->buildXml($data);
        $xmlResponse = $this->executeRequest($xmlPayload);

        AppLogger::api()->debug('Query available numbers response received', [
            'dept_id' => $data['dept_id'] ?? 'unknown',
        ]);

        return $this->parseResponse($xmlResponse);
    }

    /**
     * Reserve a service number.
     */
    public function reserveNumberService(string $numberService): bool
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1029,
            'res_code' => $numberService,
        ];

        return $this->reserveNumberService->pick($data);
    }

    /**
     * Release a previously reserved service number.
     */
    public function releaseNumberService(string $numberService): bool
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1030,
            'res_code' => $numberService,
        ];

        return $this->reserveNumberService->unpick($data);
    }

    /**
     * Build SOAP XML request for querying available numbers.
     */
    protected function buildXml(array $data): string
    {
        $config = config('services.ng');

        // Use shared helpers for dynamic values
        $transactionId = $this->generateTransactionId();

        // Extract parameters with defaults
        $payMode = $data['pay_mode'] ?? '1';
        $teleType = $data['tele_type'] ?? '4';
        $resCnt = $data['res_cnt'] ?? 15;
        $deptId = $data['dept_id'];

        // Config values
        $channelId = $config['channel_id'];
        $techChannelId = $config['technical_channel_id'];
        $accessUser = $config['access_user'];
        $accessPwd = $config['access_pwd'];

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
         <ser:PayMode>{$payMode}</ser:PayMode>
         <ser:TeleType>{$teleType}</ser:TeleType>
         <ser:NeedQueryByDept>{$deptId}</ser:NeedQueryByDept>
         <ser:ResCnt>{$resCnt}</ser:ResCnt>
         <ser:NeedQueryByDept>true</ser:NeedQueryByDept>
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
            AppLogger::api()->error('Failed to parse available numbers XML response', [
                'xml_preview' => substr($xml, 0, 500),
            ]);
            return [];
        }

        $body = $soap->children('http://schemas.xmlsoap.org/soap/envelope/')->Body;
        $response = $body->children('http://oss.huawei.com/webservice/bss/services')->QueryAvailableNumberRspMsg;

        if (!$response) {
            AppLogger::api()->error('Missing QueryAvailableNumberRspMsg in response');
            return [];
        }

        $header = $response->ResponseHeader;
        $comNs = 'http://www.huawei.com/bss/soaif/interface/common/';
        $retCode = (string) $header->children($comNs)->RetCode;
        $retMsg = (string) $header->children($comNs)->RetMsg;

        if ($retCode !== '0') {
            AppLogger::api()->error('Query available numbers API returned error', [
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
            ]);
            return [];
        }

        $numberList = [];
        $availableNumbers = $response->AvailableNumberList->AvailableNumber ?? [];

        foreach ($availableNumbers as $number) {
            $numberList[] = [
                'ServiceNumber' => (string) $number->ServiceNumber,
                'ItemCode' => (string) $number->ItemCode,
                'ResDeptId' => (string) $number->ResDeptId,
                'PayMode' => (string) $number->PayMode,
                'TeleType' => (string) $number->TeleType,
                'Level' => (string) $number->Level,
            ];
        }

        AppLogger::api()->debug('Available numbers parsed', [
            'count' => count($numberList),
        ]);

        return $numberList;
    }
}
