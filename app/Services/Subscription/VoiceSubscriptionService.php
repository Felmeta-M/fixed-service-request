<?php

namespace App\Services\Subscription;

use App\Models\SurveyRequest;
use App\Enums\FFDServiceProvisionStatus;
use App\Models\Customer;
use App\Services\ApiResponse;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use Illuminate\Support\Facades\Log;

class VoiceSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   protected ?string $serviceNumber = null;

   public function __construct(
      protected readonly QueryAvailableNumberService $queryAvailableNumberService,
      protected readonly ReserveNumberService $reserveNumberService,
   ) {}

   protected function offeringId(): int
   {
      return 1207609454;
   }

   protected function businessCode(): string
   {
      return 'CO015';
   }

   protected function networkType(): int
   {
      return 4;
   }

   public function create(array $data)
   {
      $xml = $this->buildXml($data);
      //   Log::info($xml);
      $response = $this->executeRequest($xml);

      return $this->parseResponse($data, $response);
   }

   protected function buildXml(array $data): string
   {
      $cfg = config('services.subscriber');
      $customer = Customer::current();

      // Override frontend data with customer defaults
      //TODO: remove hardcoded values
      $data = array_merge($data, [

         $data['name'] = $customer->name,

         'region'     => 1,
         'city'       => 1,
         'zone'       => 3,
         'wereda'     => 10,
         'kebele'     =>  'Kebele',
         'house_no'   =>  '1234',
         'sms_no'     => '12141231',

         'enterprise_name'     => 'test',
         'credit_class'        => 'Excellent',
         'payment_mode'        => 'CASH',
         'ext_payment_type'    => '0',

         'business_code'       => 'CO015',
         'external_sequence'   => uniqid(),
         'network_type'        => '4',
         'service_number'      => '123212533',
         'sub_type'            => '1',
         'sub_language'        => '2002',
         'offering_id'         => '1207609454',
         'effective_mode'      => '0',
         'sla_priority'        => '6',
         'call_center_access'  => '994',
         'external_oper_id'        => '512',

         'installment_date'        => now()->format('YmdHis'),
      ]);



      $serviceNumber = SurveyRequest::query()
         ->where('customer_survey_order_id', $data['survey_order_id'])
         ->value('service_number');

      return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:CreateNewSubscriberReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$this->transactionId()}</com:TransactionId>
            <com:SessionId>1</com:SessionId>
            <com:ProcessTime>{$this->processTime()}</com:ProcessTime>
            <com:ContactId>1</com:ContactId>
            <com:Language>2002</com:Language>
            <com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
            <com:TenantId>{$cfg['tenant_id']}</com:TenantId>
            <com:AccessUser>{$cfg['access_user']}</com:AccessUser>
            <com:AccessPwd>{$cfg['access_pwd']}</com:AccessPwd>
            <com:AccessIP>1</com:AccessIP>
            <com:OperatorId>{$cfg['access_user']}</com:OperatorId>
            <com:OperatorPwd>{$cfg['access_pwd']}</com:OperatorPwd>
            <com:TestFlag>1</com:TestFlag>
            <com:AdditionalProperty>
               <com:Code>1</com:Code>
               <com:Value>1</com:Value>
            </com:AdditionalProperty>
         </ser:RequestHeader>

         <ser:CreateNewSubscriberReqBody>
            <com:CustomerBusiOrder>
               <com:CustomerSurveyOrderId>{$data['survey_order_id']}</com:CustomerSurveyOrderId>
               <com:CustomerCode>{$data['customer_code']}</com:CustomerCode>

               <com:CustomerInfo>
                  <com:CustomerType>2</com:CustomerType>
                  <com:CustomerCategory>5</com:CustomerCategory>
                  <com:CustomerSubcategory>14</com:CustomerSubcategory>
                  <com:CustomerLevel>2</com:CustomerLevel>
                  <com:CustomerName>{$data['name']}</com:CustomerName>
                  <com:BranchName>BranchName</com:BranchName>
                  <com:Title>1</com:Title>
                  <com:Nationality>1</com:Nationality>
                  <com:IdentificationType>5</com:IdentificationType>
                  <com:IdentificationNumber>2022112233</com:IdentificationNumber>
                  <com:Gender>1</com:Gender>
                  <com:DateofBirth>19660612</com:DateofBirth>
                  <com:PrimaryLanguage>2002</com:PrimaryLanguage>

                  <com:CustomerAddressInfo>
                     <com:EthioZoneOrRegion>{$data['region']}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$data['city']}</com:AdministrativeRegionOrCity>
                     <com:SubcityOrZone>{$data['zone']}</com:SubcityOrZone>
                     <com:WeredaOrTown>{$data['wereda']}</com:WeredaOrTown>
                     <com:Kebele>{$data['kebele']}</com:Kebele>
                     <com:HouseNo>{$data['house_no']}</com:HouseNo>
                  </com:CustomerAddressInfo>

                  <com:CustomerContactInfo>
                     <com:NotificationMode>2</com:NotificationMode>
                     <com:MobileNo>{$data['sms_no']}</com:MobileNo>
                  </com:CustomerContactInfo>
               </com:CustomerInfo>

               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:BillCycle>01</com:BillCycle>
                  <com:InitialCredit>100</com:InitialCredit>
                  <com:ethioZoneOrRegion>{$data['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>2002</com:Language>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:CreditClass>Excellent</com:CreditClass>
                  <com:AdministrativeRegionCity>{$data['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$data['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$data['wereda']}</com:WeredaTown>
                  <com:Kebele>{$data['kebele']}</com:Kebele>
                  <com:HouseNo>{$data['house_no']}</com:HouseNo>
                  <com:SMSNo>{$data['sms_no']}</com:SMSNo>
                  <com:PaymentMode>
                     <com:PaymentMode>{$data['payment_mode']}</com:PaymentMode>
                  </com:PaymentMode>
               </com:AccountInfo>
            </com:CustomerBusiOrder>

            <com:SubBusiOrderlist>
               <com:BusinessCode>{$this->businessCode()}</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:ServiceNumber>{$serviceNumber}</com:ServiceNumber>
                  <com:NetworkType>{$this->networkType()}</com:NetworkType>
                  <com:SubType>0</com:SubType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$this->offeringId()}</com:OfferingId>
                        </com:OfferingId>
                     </com:NewPrimaryOffering>
                  </com:PrimaryOffering>
                  <com:SLAPriority>0</com:SLAPriority>
                  <com:CallCenterAccess>980,894</com:CallCenterAccess>
                  <com:SubLanguage>2002</com:SubLanguage>
                  <com:IVRLanguage>2060</com:IVRLanguage>
                  <com:GreenFlag>1</com:GreenFlag>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>

            <com:ExternalOperid>{$data['external_oper_id']}</com:ExternalOperid>
            <com:ExternalOperName>helloworld</com:ExternalOperName>
            <com:InstallmentCompletedDate>{$data['installment_date']}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }

   protected function parseResponse(array $data, string $xml)
   {
      $parsed = simplexml_load_string($xml);
      $ns = $parsed->getNamespaces(true);

      $body = $parsed->children($ns['soapenv'])->Body;
      $rsp  = $body->children($ns['ser'])->CreateNewSubscriberRspMsg;
      $hdr  = $rsp->ResponseHeader->children($ns['com']);

      if ((string) $hdr->RetCode !== '0') {
         // 🔴 release reserved number on failure
         if ($this->serviceNumber) {
            $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
         }

         return ApiResponse::error((string) $hdr->RetMsg);
      }

      $customerBusiOrderId = (string) $rsp->CustomerBusiOrderId;

      // create survey order request and initia payment
      SurveyRequest::where('customer_survey_order_id', $data['survey_order_id'])
         ->update([
            'service_number' => $this->serviceNumber,
            'status' => FFDServiceProvisionStatus::Subscribed->value,
            'subscribed_at' => now(),
         ]);

      return ApiResponse::success([
         'customer_busi_order_id' => $customerBusiOrderId,
         'service_number' => $this->serviceNumber,
      ]);
   }
}
