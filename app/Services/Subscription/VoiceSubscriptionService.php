<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\ApiResponse;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Traits\InteractsWithSMSGateway;
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
      // Use shared helper to hydrate customer data
      $data = $this->hydrateWithCustomerData($data);

      $xml = $this->buildXml($data);
      $response = $this->executeRequest($xml);
      Log::info('Huawei Voice Response', ['response' => $response]);
      $parsedResponse = $this->parseResponse($data, $response);
      return $parsedResponse;

   }

   protected function buildXml(array $data): string
   {
      $cfg = config('services.subscriber');

      // Get dynamic customer profile, address, and BSS classification from logged-in user
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $bss = $this->getBssClassification();    

      // Business defaults
      $data = array_merge($data, [
         'enterprise_name'     => $profile['name'] ?? 'Customer',
         'credit_class'        => $bss['credit_class'],
         'payment_mode'        => 'CASH',
         'ext_payment_type'    => '0',
         'business_code'       => 'CO015',
         'external_sequence'   => uniqid(),
         'network_type'        => '4',
         'sub_type'            => '1',
         'sub_language'        => $profile['primary_language'],
         'offering_id'         => '1207609454',
         'effective_mode'      => '0',
         'sla_priority'        => '6',
         'call_center_access'  => '994',
         'external_oper_id'    => '512',
         'installment_date'    => $this->completedDate(),
      ]);

      $serviceNumber = SurveyOrder::query()
         ->where('customer_survey_order_id', $data['survey_order_id'])
         ->value('service_number');
      // 🔴 release reserved number on failure
      if ($serviceNumber) {
         $this->queryAvailableNumberService->releaseNumberService($serviceNumber);
      }

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
            <com:Language>{$profile['primary_language']}</com:Language>
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
                  <com:CustomerType>{$bss['customer_type']}</com:CustomerType>
                  <com:CustomerCategory>{$bss['customer_category']}</com:CustomerCategory>
                  <com:CustomerSubcategory>{$bss['customer_subcategory']}</com:CustomerSubcategory>
                  <com:CustomerLevel>{$bss['customer_level']}</com:CustomerLevel>
                  <com:CustomerName>{$profile['name']}</com:CustomerName>
                  <com:BranchName>BranchName</com:BranchName>
                  <com:Title>{$profile['title']}</com:Title>
                  <com:Nationality>{$profile['nationality']}</com:Nationality>
                  <com:IdentificationType>{$profile['identification_type']}</com:IdentificationType>
                  <com:IdentificationNumber>{$profile['identification_number']}</com:IdentificationNumber>
                  <com:Gender>{$profile['gender']}</com:Gender>
                  <com:DateofBirth>{$profile['birthdate']}</com:DateofBirth>
                  <com:PrimaryLanguage>{$profile['primary_language']}</com:PrimaryLanguage>

                  <com:CustomerAddressInfo>
                     <com:EthioZoneOrRegion>{$address['ethio_zone']}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$address['region']}</com:AdministrativeRegionOrCity>
                     <com:SubcityOrZone>{$address['zone']}</com:SubcityOrZone>
                     <com:WeredaOrTown>{$address['wereda']}</com:WeredaOrTown>
                     <com:Kebele>{$address['kebele']}</com:Kebele>
                     <com:HouseNo>{$address['house_no']}</com:HouseNo>
                  </com:CustomerAddressInfo>

                  <com:CustomerContactInfo>
                     <com:NotificationMode>{$bss['notification_mode']}</com:NotificationMode>
                     <com:MobileNo>{$data['sms_no']}</com:MobileNo>
                  </com:CustomerContactInfo>
               </com:CustomerInfo>

               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:BillCycle>01</com:BillCycle>
                  <com:InitialCredit>100</com:InitialCredit>
                  <com:ethioZoneOrRegion>{$address['ethio_zone']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>{$profile['primary_language']}</com:Language>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:CreditClass>{$bss['credit_class']}</com:CreditClass>
                  <com:AdministrativeRegionCity>{$address['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$address['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$address['wereda']}</com:WeredaTown>
                  <com:Kebele>{$address['kebele']}</com:Kebele>
                  <com:HouseNo>{$address['house_no']}</com:HouseNo>
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
         return ApiResponse::error((string) $hdr->RetMsg);
      }

      $customerBusiOrderId = (string) $rsp->CustomerBusiOrderId;

      // create survey order request and initia payment
      SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'])
         ->update([
            'service_number' => $this->serviceNumber,
            'status' => FFDServiceProvisionStatus::Subscribed->value,
            'subscribed_at' => now(),
         ]);

      // ✅ Send SMS to customer
      if (! empty($data['sms_no']) && InteractsWithSMSGateway::ensurePhoneIsLocal($data['sms_no'])) {

         $phone = $data['sms_no'];
         $name  = trim(explode(' ', $data['name'] ?? '')[0] ?? 'Customer');

         $message = sprintf(
            'Dear %s, thank you for choosing Ethio telecom. Your subscription has been successfully created. For support or to submit a TT/complaint, please visit https://fixedservices.ethiotelecom.et/services.',
            $name
         );

         try {
            InteractsWithSMSGateway::sendSmsOnly($phone, $message);
         } catch (\RuntimeException $e) {
            // Business-level failure (rate limit, gateway reject)
            Log::warning('Subscription SMS blocked or rejected', [
               'phone'   => $phone,
               'reason'  => $e->getMessage(),
            ]);
         } catch (\Throwable $e) {
            // System-level failure
            Log::error('Subscription SMS failed unexpectedly', [
               'phone'  => $phone,
               'error'  => $e->getMessage(),
            ]);
         }
      }

      return ApiResponse::success([
         'customer_busi_order_id' => $customerBusiOrderId,
         'service_number' => $this->serviceNumber,
      ]);
   }
}
