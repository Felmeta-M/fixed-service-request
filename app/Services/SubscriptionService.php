<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Support\CustomerContext;
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

   protected function generateSimpleEmail(): string
   {
      $prefix = Str::random(8);
      $domain = 'qq.com';

      return strtolower($prefix . '@' . $domain);
   }

   public function createNewSubscriber(array $data)
   {
      try {
         $xmlPayload = $this->buildRequestXml($data);
         $xmlResponse = $this->executeRequest($xmlPayload);
         $parsedXml = $this->parseResponseXml($data, $xmlResponse);
         return ApiResponse::success($parsedXml);
      } catch (\RuntimeException $e) {
         return ApiResponse::error($e->getMessage(), 500);
      } catch (\Throwable $e) {
         return ApiResponse::fromException($e, 'Create new subscriber failed.');
      }
   }

   private function buildRequestXml(array $data): string
   {
      // Use shared helpers from BaseApiService
      $transactionId = $this->transactionId();
      $processTime   = $this->processTime();
      $config = config('services.subscriber');

      // Get customer data dynamically
      $data['customer_code'] = $this->customerCode($data['customer_code'] ?? null);
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $nameParts = CustomerContext::nameParts();

      $data['offering_id'] = $data['offering_id'] ?? 1457567289;
      $email = $data['email'] ?? $this->customerEmail() ?? $this->generateSimpleEmail();

      return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/" xmlns:ser="http://oss.huawei.com/webservice/bss/services">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:CreateNewSubscriberReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>{$profile['primary_language']}</com:Language>
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
                  <com:BillCycle>{$profile['bill_cycle']}</com:BillCycle>
                  <com:ethioZoneOrRegion>{$address['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>{$profile['collection_center']}</com:CollectionCenter>
                  <com:Language>{$profile['primary_language']}</com:Language>
                  <com:FirstName>{$nameParts['first_name']}</com:FirstName>
                  <com:MiddleOrFatherName>{$nameParts['middle_name']}</com:MiddleOrFatherName>
                  <com:LastName>{$nameParts['last_name']}</com:LastName>
                  <com:EnterpriseCustomerName>{$profile['enterprise_customer_name']}</com:EnterpriseCustomerName>
                  <com:CreditClass>{$profile['credit_class']}</com:CreditClass>
                  <com:AdministrativeRegionCity>{$address['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$address['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$address['wereda']}</com:WeredaTown>
                  <com:Kebele>{$address['kebele']}</com:Kebele>
                  <com:HouseNo>{$address['house_no']}</com:HouseNo>
                  <com:SMSNo>{$this->formatPhoneNumber($this->customerPhone())}</com:SMSNo>
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
                  <com:ExternalSequnce>{$transactionId}</com:ExternalSequnce>
                  <com:NetworkType>3</com:NetworkType>
                  <com:SubType>1</com:SubType>
                  <com:SubLanguage>{$profile['primary_language']}</com:SubLanguage>
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
            <com:InstallmentCompletedDate>{$this->completedDate()}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }

   private function parseResponseXml(array $data, string $xml)
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
            'ret_msg'  => 'Missing Create New Subscriber Rsp Msg',
         ];
      }
      $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']) ?? null;
      $retCode = (string) ($responseHeader->RetCode ?? '');
      $retMsg  = (string) ($responseHeader->RetMsg ?? '');

      if ($retCode !== '0') {
         return ApiResponse::error('Service subscription failed!');
      }

      // Fetch the survey request record
      $surveyRequest = SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'])->first();

      if (!$surveyRequest) {
         return ApiResponse::error('Survey request not found');
      }

      // 1. If service number already exists in DB → reuse it
      if ($surveyRequest->service_number) {
         $numberService = $surveyRequest->service_number;
      } else {
         // 2. If not existing → get new service number
         $numberService = $this->getAvailableNumberServices();

         if (!$numberService) {
            return ApiResponse::error('Unable to reserve number service');
         }
         // 3. Save new service number to DB
         $surveyRequest->update([
            'service_number' => $numberService,
            'status' => FFDServiceProvisionStatus::Completed->value,
            'subscribed_at' => now(),
            // TODO: update completed_date based on survey result
         ]);
      }

      return ApiResponse::success([
         'success'   => true,
         'ret_code'  => $retCode,
         'ret_msg'   => $retMsg,
         'body'      => $responseMsg,
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
