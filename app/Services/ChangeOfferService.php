<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ChangeOfferService
{
   public function getAccountList(string $serviceNumber): string
   {
      $xml = $this->buildXml($serviceNumber);

      $response = Http::withHeaders([
         'Content-Type' => 'text/xml; charset=utf-8',
      ])->withBody($xml, 'text/xml')->post(config('services.change_offer.endpoint'));

      return $response->body();
   }

   protected function buildXml(string $serviceNumber): string
   {
      $transactionId = now()->format('YmdHis');
      $processTime = now()->format('YmdHis');

      return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:GetAccountListRequest>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:ChannelId>{config('services.change_offer.channel_id')}</com:ChannelId>
            <com:TechnicalChannelId>{config('services.change_offer.tech_channel_id')}</com:TechnicalChannelId>
            <com:TenantId>{config('services.change_offer.tenant_id')}</com:TenantId>
            <com:AccessUser>{config('services.change_offer.user')}</com:AccessUser>
            <com:AccessPwd>{config('services.change_offer.password')}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:GetAccountListBody>
            <com:ServiceNumber>{$serviceNumber}</com:ServiceNumber>
         </ser:GetAccountListBody>
      </ser:GetAccountListRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }
}
