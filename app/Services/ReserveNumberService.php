<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
use RuntimeException;

class ReserveNumberService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 30;

    protected function endpoint(): string
    {
        return config('services.number_service_reserve.endpoint');
    }

    /**
     * Reserve (pick) a service number.
     */
    public function pick(array $data): bool
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $result = $this->parseResponseXml($xmlResponse, $data['res_code']);

            if ($result) {
                AppLogger::api()->info('Number reserved (picked) successfully', [
                    'res_code' => $data['res_code'],
                ]);
            }

            return $result;

        } catch (RuntimeException $e) {
            AppLogger::api()->error('Failed to pick number', [
                'res_code' => $data['res_code'],
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Release (unpick) a previously reserved service number.
     */
    public function unpick(array $data): bool
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $result = $this->parseResponseXml($xmlResponse, $data['res_code']);

            if ($result) {
                AppLogger::api()->info('Number released (unpicked) successfully', [
                    'res_code' => $data['res_code'],
                ]);
            }

            return $result;

        } catch (RuntimeException $e) {
            AppLogger::api()->error('Failed to unpick number', [
                'res_code' => $data['res_code'],
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build request XML for number reservation operations.
     */
    protected function buildRequestXml(array $data): string
    {
        // Use shared helpers
        $transactionId = $this->transactionId();
        $processTime = $this->processTime();

        $config = config('services.number_service_reserve');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:UniqueResourceOperationReqMsg>
         <ser:RequestHeader>
            <com:Version>{$config['version']}</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>{$config['language']}</com:Language>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['technical_channel_id']}</com:TechnicalChannelId>
            <com:TenantId>{$config['tenant_id']}</com:TenantId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:UniqueResourceOperationRequestBody>
            <com:ResTypeId>{$data['res_type_id']}</com:ResTypeId>
            <com:OperType>{$data['oper_type']}</com:OperType>
            <com:ResCode>{$data['res_code']}</com:ResCode>
         </ser:UniqueResourceOperationRequestBody>
      </ser:UniqueResourceOperationReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP response for reservation operations.
     */
    protected function parseResponseXml(string $xml, string $resCode): bool
    {
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            AppLogger::api()->error('Failed to parse reserve number XML response', [
                'res_code' => $resCode,
                'xml_preview' => substr($xml, 0, 500),
            ]);
            return false;
        }

        $namespaces = $parsed->getNamespaces(true);

        $body = $parsed->children($namespaces['soapenv'])->Body ?? null;
        $responseMsg = $body?->children($namespaces['ser'])->UniqueResourceOperationRspMsg ?? null;

        if (!$responseMsg) {
            AppLogger::api()->error('Missing UniqueResourceOperationRspMsg in response', [
                'res_code' => $resCode,
            ]);
            return false;
        }

        // Check response header for errors
        $header = $responseMsg->ResponseHeader?->children($namespaces['com']);
        $retCode = (string) ($header->RetCode ?? '');
        $retMsg = (string) ($header->RetMsg ?? '');

        if ($retCode !== '0' && $retCode !== '') {
            AppLogger::api()->warning('Reserve number API returned error', [
                'res_code' => $resCode,
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
            ]);
        }

        $responseBody = $responseMsg->UniqueResourceOperationResponseBody?->children($namespaces['com']) ?? null;
        $result = (string) ($responseBody->Result ?? '');

        AppLogger::api()->debug('Reserve number response parsed', [
            'res_code' => $resCode,
            'result' => $result,
        ]);

        // Result: 1 = success, -1 = already reserved (still considered success)
        return match ($result) {
            '1', '-1' => true,
            default => false,
        };
    }
}
