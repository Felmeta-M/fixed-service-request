<?php

namespace App\Services;

class SubscriptionService extends BaseApiService
{
   protected int $timeout = 20;
   protected int $rateLimit = 15;

   protected function endpoint(): string
   {
      return config('services.subscriber.endpoint');
   }

   public function createNewSubscriber(array $data)
   {
      try {
         $xmlPayload = $this->buildRequestXml($data);
         $xmlResponse = $this->executeRequest($xmlPayload);
         $parsedXml = $this->parseResponseXml($xmlResponse);
         return ApiResponse::success($parsedXml);
      } catch (\RuntimeException $e) {
         return ApiResponse::error($e->getMessage(), 500);
      } catch (\Throwable $e) {
         return ApiResponse::exception($e, 'Resource check failed.');
      }
   }

   private function buildRequestXml(array $data): string
   {
      $transactionId = uniqid();
      $processTime   = now()->format('YmdHis');
      $config = config('services.subscriber');

      return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/" xmlns:ser="http://oss.huawei.com/webservice/bss/services">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:CreateNewSubscriberReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>2002</com:Language>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['technical_channel_id']}</com:TechnicalChannelId>
            <com:TenantId>{$config['tenant_id']}</com:TenantId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
            <com:OperatorId>{$config['operator_id']}</com:OperatorId>
         </ser:RequestHeader>
         <ser:CreateNewSubscriberReqBody>
            <com:CustomerBusiOrder>
               <com:CustomerSurveyOrderId>{$data['survey_order_id']}</com:CustomerSurveyOrderId>
               <com:CustomerCode>{$data['customer_code']}</com:CustomerCode>
               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:BillCycle>01</com:BillCycle>
                  <com:ethioZoneOrRegion>{$data['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10163</com:CollectionCenter>
                  <com:Language>2002</com:Language>
                  <com:FirstName>{$data['first_name']}</com:FirstName>
                  <com:MiddleOrFatherName>{$data['middle_name']}</com:MiddleOrFatherName>
                  <com:LastName>{$data['last_name']}</com:LastName>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:CreditClass>Excellent</com:CreditClass>
                  <com:AdministrativeRegionCity>{$data['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$data['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$data['wereda']}</com:WeredaTown>
                  <com:Kebele>{$data['kebele']}</com:Kebele>
                  <com:HouseNo>{$data['house_no']}</com:HouseNo>
                  <com:SMSNo>{$data['sms_no']}</com:SMSNo>
                  <com:PaymentMode>
                     <com:PaymentMode>CASH</com:PaymentMode>
                  </com:PaymentMode>
                  <com:ExtParamList>
                     <com:ParameterInfo>
                        <com:ParamName>paymentType</com:ParamName>
                        <com:ParamValue>0</com:ParamValue>
                     </com:ParameterInfo>
                  </com:ExtParamList>
               </com:AccountInfo>
            </com:CustomerBusiOrder>
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:ExternalSequnce>798863b45b6b4273b8a2321ebb46f6cd</com:ExternalSequnce>
                  <com:NetworkType>3</com:NetworkType>
                  <com:SubType>1</com:SubType>
                  <com:SubLanguage>2002</com:SubLanguage>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$data['offering_id']}</com:OfferingId>
                        </com:OfferingId>
                     </com:NewPrimaryOffering>
                     <com:EffectiveMode>0</com:EffectiveMode>
                  </com:PrimaryOffering>
                  <com:SLAPriority>6</com:SLAPriority>
                  <com:CallCenterAccess>994</com:CallCenterAccess>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>
            <com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
            <com:InstallmentCompletedDate>{$data['completed_date']}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }

   private function parseResponseXml(string $xml): array
   {
      $xmlObj = simplexml_load_string($xml, "SimpleXMLElement", 0, "soapenv", true);
      $xmlObj->registerXPathNamespace('soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
      $xmlObj->registerXPathNamespace('ser', 'http://oss.huawei.com/webservice/bss/services');
      $xmlObj->registerXPathNamespace('com', 'http://www.huawei.com/bss/soaif/interface/common/');

      $body = $xmlObj->xpath('//soapenv:Body')[0];

      $rsp = $body->children('ser', true)->CreateNewSubscriberRspMsg;

      return [
         'code' => (string) $rsp->ResponseHeader->children('com', true)->RetCode,
         'message' => (string) $rsp->ResponseHeader->children('com', true)->RetMsg,
         'customer_busi_order_id' => (string) $rsp->CustomerBusiOrderId,
         'ext_params' => array_map(function ($param) {
            return [
               'name' => (string) $param->ParamName,
               'value' => (string) $param->ParamValue,
            ];
         }, iterator_to_array($rsp->ExtParamList->children('com', true)->ParameterInfo ?? [])),
      ];
   }
}
