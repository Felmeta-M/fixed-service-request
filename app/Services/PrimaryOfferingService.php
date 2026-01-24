<?php

namespace App\Services;

class PrimaryOfferingService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.primary_offers.endpoint');
    }

    public function queryAvailablePrimaryOffering(string $serviceNumber)
    {
        try {
            $xmlPayload = $this->buildXml($serviceNumber);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponse($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::fromException($e, 'Primary number query failed.');
        }
    }

    public static function buildXml(string $objectId): string
    {
        $transactionId = uniqid();
        $channelId = config('services.primary_offers.channel_id');
        $techChannelId = config('services.primary_offers.technical_channel_id');
        $accessUser = config('services.primary_offers.access_user');
        $accessPwd = config('services.primary_offers.access_pwd');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QueryAvailablePrimaryOfferingReqMsg>
         <ser:RequestHeader>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>{$channelId}</com:ChannelId>
            <com:TechnicalChannelId>{$techChannelId}</com:TechnicalChannelId>
            <com:AccessUser>{$accessUser}</com:AccessUser>
            <com:AccessPwd>{$accessPwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:AccessInfo>
            <com:ObjectIdType>4</com:ObjectIdType>
            <com:ObjectId>{$objectId}</com:ObjectId>
         </ser:AccessInfo>
      </ser:QueryAvailablePrimaryOfferingReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(string $xml)
    {
        $xmlObject = simplexml_load_string($xml);

        if ($xmlObject === false) {
            return ApiResponse::error("Invalid XML response for Primary Offering");
        }

        $namespaces = $xmlObject->getNamespaces(true);

        $response = $xmlObject->children($namespaces['soapenv'])
            ->Body
            ->children($namespaces['ser'])
            ->QueryAvailablePrimaryOfferingRspMsg;

        $responseHeader = $response->ResponseHeader->children($namespaces['com']);
        $retCode = (string) $responseHeader->RetCode;
        $retMsg = (string) $responseHeader->RetMsg;
        $respTime = (string) $responseHeader->ResponseTime;

        if ($retCode !== '0') {
            return ApiResponse::error("Primary Offering API returned error");
        }

        $offering = $response->PrimaryOffering->children($namespaces['com']);

        $parsedOffering = [
            'offering_id' => (string) $offering->OfferingId->OfferingId,
            'offering_name' => (string) $offering->OfferingName,
            'short_name' => (string) $offering->OfferingShortName,
            'network_type' => (string) $offering->NetworkType,
            'effective_date' => (string) $offering->EffectiveDate,
            'expire_date' => (string) $offering->ExpireDate,
            'monthly_cost' => (string) $offering->MonthlyCost,
            'one_time_cost' => (string) $offering->OneTimeCost,
        ];

        return ApiResponse::success([
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'timestamp' => $respTime,
            'offering' => $parsedOffering,
        ]);
    }
}
