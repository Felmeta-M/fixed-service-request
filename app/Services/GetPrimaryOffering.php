<?php

namespace App\Services;

class GetPrimaryOffering extends BaseApiService
{
    protected int $timeout = 20;
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
            return ApiResponse::exception($e, 'Primary number query failed.');
        }
    }

    public static function buildXml(string $objectId): string
    {
        $transactionId = str()->uuid()->toString();
        $channelId = config('services.primary_offers.channel_id');
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
            <com:TechnicalChannelId>{$channelId}</com:TechnicalChannelId>
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

    protected function parseResponse(string $xml): ?array
    {
        $xmlObj = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        $xmlObj->registerXPathNamespace('soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
        $xmlObj->registerXPathNamespace('ser', 'http://oss.huawei.com/webservice/bss/services');
        $xmlObj->registerXPathNamespace('com', 'http://www.huawei.com/bss/soaif/interface/common/');

        $offering = $xmlObj->xpath('//ser:PrimaryOffering')[0] ?? null;
        if (!$offering) return null;

        $com = $offering->children('com', true);

        return [
            'offering_id'        => (string) $com->OfferingId->OfferingId,
            'offering_name'      => (string) $com->OfferingName,
            'offering_short_name' => (string) $com->OfferingShortName,
            'network_type'       => (int)    $com->NetworkType,
            'effective_date'     => (string) $com->EffectiveDate,
            'expire_date'        => (string) $com->ExpireDate,
            'monthly_cost'       => (float)  $com->MonthlyCost,
            'one_time_cost'      => (float)  $com->OneTimeCost,
        ];
    }
}
