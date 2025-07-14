<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\PrimaryOffering;

class GetPrimaryOffering
{
    public function queryAvailablePrimaryOffering(string $objectId): ?PrimaryOffering
    {
        $xmlRequest = $this->xmlBuildQueryAvailablePrimaryOffering($objectId);
        $url = config('services.primary_offers.url');

        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xmlRequest, 'text/xml')->post($url);

        if (!$response->successful()) {
            logger()->error("Huawei API failed", ['status' => $response->status()]);
            return null;
        }

        return $this->parseAndStore($response->body());
    }

    public static function xmlBuildQueryAvailablePrimaryOffering(string $objectId): string
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

    private function parseResponse(string $xml): ?array
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
