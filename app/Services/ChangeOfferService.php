<?php

namespace App\Services;

use Illuminate\Http\JsonResponse;

class ChangeOfferService extends BaseApiService
{
   protected int $timeout = 10;
   protected int $rateLimit = 15;

   protected function endpoint(): string
   {
      return config('services.ng.endpoint');
   }

   public function changePrimaryOffering(
      string $serviceNumber,
      string $oldOfferingId,
      string $newOfferingId,
      string $oldValue,
      string $value,
   ): JsonResponse {
      try {

         $xmlPayload = $this->buildXml(
            $serviceNumber,
            $oldOfferingId,
            $newOfferingId,
            $oldValue,
            $value,
         );
         $xmlResponse = $this->executeRequest($xmlPayload);
         $parsedXml = $this->parseXmlResponse($xmlResponse);

         return ApiResponse::success($parsedXml);
      } catch (\RuntimeException $e) {
         return ApiResponse::error($e->getMessage(), 500);
      } catch (\Throwable $e) {
         return ApiResponse::exception($e, 'Change primary offering failed.');
      }
   }

   protected function buildXml(
      string $serviceNumber,
      string $oldOfferingId,
      string $newOfferingId,
      string $oldValue,
      string $value,
   ): string {
      $cfg = config('services.ng');
      $transactionId = now()->format('YmdHis');
      $processTime = now()->format('YmdHis');
      $propertyCode = '50020';
      $effectiveMode = 'I';
      $objectIdType = '4';
      $actionType = '2';

      return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:ChangePrimaryOfferingReqMsg>
         <ser:RequestHeader>
            <!--Optional:-->
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <!--Optional:-->
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <!--Optional:-->
            <com:Language>{$cfg['language']}</com:Language>
            <com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
            <!--Optional:-->
            <com:TenantId>{$cfg['tenant_id']}</com:TenantId>
            <com:AccessUser>{$cfg['access_user']}</com:AccessUser>
            <!--Abc1234%-->
            <com:AccessPwd>{$cfg['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:AccessInfo>
            <com:ObjectIdType>{$objectIdType}</com:ObjectIdType>
            <com:ObjectId>{$serviceNumber}</com:ObjectId>
         </ser:AccessInfo>
         <!--Optional:-->
        <ser:OldPrimaryOffering>
            <com:OfferingId>{$oldOfferingId}</com:OfferingId>
         </ser:OldPrimaryOffering>
         <ser:NewPrimaryOffering>
           <com:OfferingId>
               <com:OfferingId>{$newOfferingId}</com:OfferingId>
            </com:OfferingId>      
            <com:InstanceProperty>
               <com:PropertyCode>{$propertyCode}</com:PropertyCode>
               <!--Optional:-->
               <com:OldValue>{$oldValue}</com:OldValue>
               <!--You have a CHOICE of the next 2 items at this level-->
               <com:Value>{$value}</com:Value>
            </com:InstanceProperty>
            <ser:EffectiveMode>
               <com:Mode>{$effectiveMode}</com:Mode>
            </ser:EffectiveMode>
         </ser:NewPrimaryOffering>
         <!--Optional:-->
         <ser:ExtParamList>
            <!--Zero or more repetitions:-->
            <com:ParameterInfo>
               <com:ParamName>ActionType</com:ParamName>
               <com:ParamValue>{$actionType}</com:ParamValue>                   
            </com:ParameterInfo>
         </ser:ExtParamList>
      </ser:ChangePrimaryOfferingReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }
}
