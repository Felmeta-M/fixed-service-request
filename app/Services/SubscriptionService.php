<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionService extends BaseApiService
{

   protected int $timeout = 10;
   protected int $rateLimit = 15;

   public function __construct(
      protected readonly QueryAvailableNumberService $queryAvailableNumberService,
      protected readonly ReserveNumberService $reserveNumberService,
   ) {}

   protected function endpoint(): string
   {
      return config('services.subscriber.endpoint');
   }

   protected function generateSimpleEmail()
   {
      $prefix = Str::random(8);
      $domain = '@qq.com';

      return strtolower($prefix . '@' . $domain);
   }

   public function createNewSubscriber(array $data)
   {
      try {
         $xmlPayload = $this->buildRequestXml($data);
         $xmlResponse = $this->executeRequest($xmlPayload);
         Log::info($xmlResponse);
         $parsedXml = $this->parseResponseXml($data, $xmlResponse);
         return ApiResponse::success($parsedXml);
      } catch (\RuntimeException $e) {
         return ApiResponse::error($e->getMessage(), 500);
      } catch (\Throwable $e) {
         return ApiResponse::exception($e, 'Create new subscriber failed.');
      }
   }

   private function buildRequestXml(array $data): string
   {
      $transactionId = uniqid();
      $processTime   = now()->format('YmdHis');
      $config = config('services.subscriber');

      $data['offering_id'] = 1457567289; // voice 1207609454; //
      $data['zone'] = 17;
      $data['region'] = 3;
      $data['city'] = 3;

      $email = $this->generateSimpleEmail();

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
                    <com:InternetAccount>{$email}</com:InternetAccount>
                     <com:InternetPassword>REDACTED_PASSWORD</com:InternetPassword>
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

   protected function parseResponseXml(array $data, string $xml)
   {
      $parsed = simplexml_load_string($xml);

      if ($parsed === false) {
         return [
            'success'  => false,
            'ret_code' => null,
            'ret_msg'  => 'Invalid XML response',
         ];
      }

      $namespaces = $parsed->getNamespaces(true);
      $body = $parsed->children($namespaces['soapenv'])->Body ?? null;

      if ($body === null) {
         return [
            'success'  => false,
            'ret_code' => null,
            'ret_msg'  => 'Missing SOAP Body',
         ];
      }

      $responseMsg = $body->children($namespaces['ser'])->CreateNewSubscriberRspMsg ?? null;
      if ($responseMsg === null) {
         return [
            'success'  => false,
            'ret_code' => null,
            'ret_msg'  => 'Missing CreateNewSubscriberRspMsg',
         ];
      }

      $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']) ?? null;
      $retCode = (string) ($responseHeader->RetCode ?? '');
      $retMsg  = (string) ($responseHeader->RetMsg ?? '');

      if ($retCode !== '0') {
         return ApiResponse::error('Service subscription failed!');
      }

      // Fetch the survey request record
      $surveyRequest = SurveyRequest::where('customer_survey_order_id', $data['survey_order_id'])->first();

      if (!$surveyRequest) {
         return ApiResponse::error('Survey request not found');
      }

      // Navigate to ExtParamList -> ParameterInfo
      $extParams = $responseMsg->ExtParamList->children($namespaces['com'] ?? null);
      $serviceNumber = null;

      if ($extParams && isset($extParams->ParameterInfo)) {
         foreach ($extParams->ParameterInfo as $paramInfo) {
            $paramInfo = $paramInfo->children($namespaces['com'] ?? null);
            if ((string) $paramInfo->ParamName === 'FBBNUMBER') {
               $serviceNumber = trim((string) $paramInfo->ParamValue);
               break;
            }
         }
      }

      if (!$serviceNumber) {
         return ApiResponse::error('Service number not found in response');
      }

      // Update the survey request with service number
      $surveyRequest->update([
         'service_number' => $serviceNumber,
         'status'         => FFDServiceProvisionStatus::Subscribed->value,
         'subscribed_at'  => now(),
      ]);

      return ApiResponse::success([
         'success'      => true,
         'ret_code'     => $retCode,
         'ret_msg'      => $retMsg,
         'service_number' => $serviceNumber,
      ]);
   }

   protected function getAvailableNumberServices(): string | bool
   {
      $data = [
         "pay_mode" => "1",
         "tele_type" => "4",
         "need_query_by_dept" => false,
         "res_cnt" => 10
      ];

      $numberList = $this->queryAvailableNumberService->queryAvailableNumbers($data) ?? [];
      if (empty($numberList)) {
         return false;
      }

      $filtered = array_filter($numberList, fn($item) => $item['Level'] === "6");
      if (empty($filtered)) {
         return false;
      }

      $numberServices = array_column($filtered, 'ServiceNumber');

      foreach ($numberServices as $numberService) {
         $status = $this->reserveNumberService($numberService);
         if ($status === true) {
            return $numberService;
         }
      }

      return false;
   }

   protected function reserveNumberService(string $numberService): bool
   {
      $data = [
         'res_type_id' => 10,
         'oper_type' => 1029,
         'res_code' => $numberService,
      ];

      return $this->reserveNumberService->pick($data);
   }

   protected function releaseNumberService(string $numberService): bool
   {
      $data = [
         'res_type_id' => 10,
         'oper_type' => 1030,
         'res_code' => $numberService,
      ];

      return $this->reserveNumberService->unpick($data);
   }
}
