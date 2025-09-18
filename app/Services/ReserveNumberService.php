<?php

namespace App\Services;

class ReserveNumberService extends BaseApiService
{
    protected int $timeout = 20;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.number_service_reserve.endpoint');
    }
    /**
     * Send UniqueResourceOperation request
     */
    public function pick(array $data): bool
    {
        $pick = true;
        $xmlPayload = $this->buildRequestXml($data);
        $xmlResponse = $this->executeRequest($xmlPayload);
        return $this->parseResponseXml($xmlResponse, $pick);
    }

    public function unpick(array $data): bool
    {
        $pick = false;
        $xmlPayload = $this->buildRequestXml($data);
        $xmlResponse = $this->executeRequest($xmlPayload);
        return $this->parseResponseXml($xmlResponse, $pick);
    }


    /**
     * Build request XML
     */
    protected function buildRequestXml(array $data)
    {
        $transactionId = uniqid();
        $processTime   = now()->format('YmdHis');
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
     * Parse SOAP response
     */
    protected function parseResponseXml(string $xml, bool $pick): bool
    {
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            return false; // invalid XML
        }

        $namespaces = $parsed->getNamespaces(true);

        $body = $parsed->children($namespaces['soapenv'])->Body ?? null;
        $responseMsg = $body?->children($namespaces['ser'])->UniqueResourceOperationRspMsg ?? null;
        $responseBody = $responseMsg?->UniqueResourceOperationResponseBody?->children($namespaces['com']) ?? null;

        $result = (string) ($responseBody->Result ?? '');

        // Success only if Result == '1'
        if ($pick) {
            return  $result === '1';
        }

        return $result === '-1';
    }
}
