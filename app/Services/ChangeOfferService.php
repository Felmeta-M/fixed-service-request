<?php

namespace App\Services;

use Illuminate\Http\JsonResponse;

class ChangeOfferService extends BaseApiService
{
   protected int $timeout = 10;
   protected int $rateLimit = 5;

   protected function endpoint(): string
   {
      return config('services.change_offer.endpoint');
   }

   public function getAccountList(string $serviceNumber): JsonResponse
   {
      try {
         $xmlPayload = $this->buildXml($serviceNumber);
         $xmlResponse = $this->executeRequest($xmlPayload);
         $parsedXml = $this->parseXmlResponse($xmlResponse);

         return ApiResponse::success($parsedXml);
      } catch (\RuntimeException $e) {
         return ApiResponse::error($e->getMessage(), 500);
      } catch (\Throwable $e) {
         return ApiResponse::exception($e, 'Account list failed.');
      }
   }

   protected function buildXml(string $serviceNumber): string
   {
      $transactionId = uniqid();
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
