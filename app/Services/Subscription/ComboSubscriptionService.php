<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\Log;

class ComboSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   public function __construct(
      protected readonly QueryAvailableNumberService $queryAvailableNumberService,
      protected readonly ReserveNumberService $reserveNumberService,
   ) {
   }

   protected function offeringId(): int
   {
      return 180427974;
   }

   protected function businessCode(): string
   {
      return 'CO015';
   }

   protected function networkType(): int
   {
      return 4;
   }

   public function create(array $payload): array
   {
      //   $data = $this->normalize($payload);

      $xml = $this->buildXml($payload);

      Log::info('Huawei Combo Request', ['xml' => $xml]);

      $response = $this->executeRequest($xml);

      Log::info('Huawei Combo Response', ['xml' => $response]);

      return $this->parseResponse($response, $payload);
   }

   protected function buildXml(array $data)
   {
      // Use shared helpers for customer data
      $data['customer_code'] = $this->customerCode($data['customer_code'] ?? null);
      $email = $data['email'] ?? $this->customerEmail() ?? $this->generateEmail();

      // Get service number
      $serviceNumber = $this->queryAvailableNumberService
         ->getAvailableNumberServices('1766044689199549668');

      if (!$serviceNumber) {
         throw new \RuntimeException('Unable to reserve service number');
      }

      // Get dynamic customer profile and address data
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $nameParts = CustomerContext::nameParts();

      $data['completed_date'] = $this->completedDate();

      return <<<XML
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
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
            <com:ChannelId>35</com:ChannelId>
            <com:TechnicalChannelId>53</com:TechnicalChannelId>
            <com:TenantId>101</com:TenantId>
           <com:AccessUser>ecaf</com:AccessUser>
            <com:AccessPwd>REDACTED_PASSWORD</com:AccessPwd> 
            <com:AccessIP>1</com:AccessIP>
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
               <com:SubLanguage>{$profile['primary_language']}</com:SubLanguage>
                  <com:IVRLanguage>{$profile['primary_language']}</com:IVRLanguage>
                  <com:CustomerType>{$profile['customer_type']}</com:CustomerType>
                  <com:CustomerCategory>{$profile['customer_category']}</com:CustomerCategory>
                  <com:CustomerSubcategory>{$profile['customer_subcategory']}</com:CustomerSubcategory>
                  <com:CustomerLevel>{$profile['customer_level']}</com:CustomerLevel>
                  <com:CustomerName>{$this->customerName()}</com:CustomerName>
                  <com:BranchName>{$profile['branch_name']}</com:BranchName>
                  <com:Title>{$profile['title']}</com:Title>
                  <com:Nationality>{$profile['nationality']}</com:Nationality>
                  <com:IdentificationType>{$profile['identification_type']}</com:IdentificationType>
                  <com:IdentificationNumber>{$profile['identification_number']}</com:IdentificationNumber>
                  <com:VATRegNo>{$profile['vat_reg_no']}</com:VATRegNo>
                  <com:Gender>{$profile['gender']}</com:Gender>
                  <com:DateofBirth>{$profile['birthdate']}</com:DateofBirth>
                  <com:PlaceofBirth>{$profile['place_of_birth']}</com:PlaceofBirth>
                  <com:Occupation>{$profile['occupation']}</com:Occupation>
                  <com:Education>{$profile['education']}</com:Education>
                  <com:Religion>{$profile['religion']}</com:Religion>
                  <com:Income>{$profile['income']}</com:Income>
                  <com:Hobbies>Sport</com:Hobbies>
                  <com:PrimaryLanguage>{$profile['primary_language']}</com:PrimaryLanguage>
                  <com:SecondaryLanguage>2060</com:SecondaryLanguage>
                  <com:SecretQuestion>1</com:SecretQuestion>
                  <com:SecretAnswer>REDACTED_PASSWORD=</com:SecretAnswer>
                  <com:PromotionMessageFlag>2</com:PromotionMessageFlag>
                  <com:CustomerAddressInfo>
                     <com:EthioZoneOrRegion>{$address['region']}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$address['city']}</com:AdministrativeRegionOrCity>
                     <com:SubcityOrZone>{$address['zone']}</com:SubcityOrZone>
                     <com:WeredaOrTown>{$address['wereda']}</com:WeredaOrTown>
                     <com:Kebele>{$address['kebele']}</com:Kebele>
                     <com:HouseNo>{$address['house_no']}</com:HouseNo>
                     <com:StreetName>{$address['street_name']}</com:StreetName>
                     <com:Apartment>{$address['apartment']}</com:Apartment>
                  </com:CustomerAddressInfo>
                  <com:CustomerContactInfo>
                     <com:NotificationMode>{$profile['notification_mode']}</com:NotificationMode>
                     <com:Email>{$email}</com:Email>
                     <com:POBox>123123</com:POBox>
                     <com:ZipCode>123123</com:ZipCode>
                     <com:HomeNo>{$this->formatPhoneNumber($this->customerPhone())}</com:HomeNo>
                     <com:OfficeNo>{$this->formatPhoneNumber($this->customerPhone())}</com:OfficeNo>
                     <com:MobileNo>{$this->formatPhoneNumber($this->customerPhone())}</com:MobileNo>
                     <com:FaxNo>213352323</com:FaxNo>
                  </com:CustomerContactInfo>
                  <com:CustomerContactPersonInfoList>
                     <com:ContactPersonInfo>
                        <com:FirstName>{$nameParts['first_name']}</com:FirstName>
                        <com:MiddleName>{$nameParts['middle_name']}</com:MiddleName>
                        <com:LastName>{$nameParts['last_name']}</com:LastName>
                        <com:Title>{$profile['title']}</com:Title>
                        <com:HomeNo>{$this->formatPhoneNumber($this->customerPhone())}</com:HomeNo>
                        <com:OfficeNo>{$this->formatPhoneNumber($this->customerPhone())}</com:OfficeNo>
                        <com:MobileNo>{$this->formatPhoneNumber($this->customerPhone())}</com:MobileNo>
                        <com:FaxNo>123123141</com:FaxNo>
                     </com:ContactPersonInfo>
                  </com:CustomerContactPersonInfoList>
               </com:CustomerInfo>
               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:BillCycle>{$profile['bill_cycle']}</com:BillCycle>
                  <com:InitialCredit>{$profile['initial_credit']}</com:InitialCredit>
                  <com:ethioZoneOrRegion>{$address['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>{$profile['collection_center']}</com:CollectionCenter>
                  <com:Language>{$profile['primary_language']}</com:Language>
                  <com:EnterpriseCustomerName>{$profile['enterprise_customer_name']}</com:EnterpriseCustomerName>
                  <com:Title>{$profile['title']}</com:Title>
                  <com:CreditClass>{$profile['credit_class']}</com:CreditClass>
                  <com:GreenList>{$profile['green_list']}</com:GreenList>
                  <com:LateFeeFlag>{$profile['late_fee_flag']}</com:LateFeeFlag>
                  <com:TaxExemptionFlag>1</com:TaxExemptionFlag>
                  <com:AdministrativeRegionCity>{$address['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$address['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$address['wereda']}</com:WeredaTown>
                  <com:Kebele>{$address['kebele']}</com:Kebele>
                  <com:HouseNo>{$address['house_no']}</com:HouseNo>
                  <com:StreetName>{$address['street_name']}</com:StreetName>
                  <com:Apartment>{$address['apartment']}</com:Apartment>
                  <com:POBox>1231231</com:POBox>
                  <com:SMSNo>{$this->formatPhoneNumber($this->customerPhone())}</com:SMSNo>
                  <com:Email>{$email}</com:Email>
                  <com:FaxNo>010-123141231</com:FaxNo>
                  <com:Postcode>123456</com:Postcode>
                  <com:PaymentMode>
                     <com:PaymentMode>CASH</com:PaymentMode>
                  </com:PaymentMode>
                  
               </com:AccountInfo>
               <com:IsCombo>1</com:IsCombo>
            </com:CustomerBusiOrder>
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <!--You have a CHOICE of the next 2 items at this level-->
               <com:GroupSubInfo>
                  <com:ExternalSequnce>?</com:ExternalSequnce>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>180427974</com:OfferingId>
                        </com:OfferingId>
                        
                     </com:NewPrimaryOffering>
                     <com:EffectiveMode>0</com:EffectiveMode>
  
                     <com:InstanceProperty>
                           <com:PropertyCode>50135</com:PropertyCode>
                           <com:PropertyType>1</com:PropertyType>
                           <com:Value>2701DTU</com:Value>
                        </com:InstanceProperty>
                        <com:InstanceProperty>
                           <com:PropertyCode>50134</com:PropertyCode>
                           <com:PropertyType>1</com:PropertyType>
                           <com:Value>2</com:Value>
                        </com:InstanceProperty>
                 
                  </com:PrimaryOffering>
                  
               </com:GroupSubInfo>
            </com:SubBusiOrderlist>
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <!--You have a CHOICE of the next 2 items at this level-->
               <com:SubscriberInfo>
                  <!--Optional:  0:Prepaid  1:Postpaid  3:Hybrid.-->
                  <com:SubType>4</com:SubType>
                  <com:ServiceNumber>{$serviceNumber}</com:ServiceNumber>
                  <!--Optional:  21：GSM 22：CDMA  3：ADSL  4：FIX  固话-->
                  <com:NetworkType>4</com:NetworkType>
                  <!--Optional:  0:Prepaid  1:Postpaid  3:Hybrid.-->
                  <com:SubType>1</com:SubType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>1207609454</com:OfferingId>
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
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <!--You have a CHOICE of the next 2 items at this level-->
               <com:SubscriberInfo>
                  <!--Optional:  0:Prepaid  1:Postpaid  3:Hybrid.-->
                  <com:SubType>0</com:SubType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>1457567289</com:OfferingId>
                        </com:OfferingId>
                     </com:NewPrimaryOffering>
                  </com:PrimaryOffering>
                  <com:SLAPriority>0</com:SLAPriority>
                  <com:InternetAccount>{$email}</com:InternetAccount>
                  <com:InternetPassword>REDACTED_PASSWORD</com:InternetPassword>
                  <com:CallCenterAccess>980,894</com:CallCenterAccess>
                  <com:SubLanguage>2002</com:SubLanguage>
                  <com:IVRLanguage>2060</com:IVRLanguage>
                  <com:GreenFlag>1</com:GreenFlag>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>
            <com:ExternalOperid>9527</com:ExternalOperid>
            <com:ExternalOperName>helloworld</com:ExternalOperName>
            <com:InstallmentCompletedDate>{$data['completed_date']}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }

   /**
    * Namespace-safe response parsing
    */
   protected function parseResponse(string $xml, array $data = []): array
   {
      $res = [
         'success' => false,
         'ret_code' => null,
         'ret_msg' => null,
         'customer_busi_order_id' => null,
         'extra_params' => [],
      ];

      $obj = simplexml_load_string($xml);
      if (!$obj) {
         return $res;
      }

      // Register namespaces dynamically
      $namespaces = $obj->getNamespaces(true);

      // SOAP Body
      $body = $obj->children($namespaces['soapenv'])->Body ?? null;
      if (!$body) {
         return $res;
      }

      // Response message
      $rsp = $body->children($namespaces['ser'])->CreateNewSubscriberRspMsg ?? null;
      if (!$rsp) {
         return $res;
      }

      // Response header
      $header = $rsp
         ->children($namespaces['ser'])
         ->ResponseHeader
         ->children($namespaces['com']);

      $res['ret_code'] = (string) $header->RetCode;
      $res['ret_msg'] = (string) $header->RetMsg;
      $res['success'] = ((string) $header->RetCode === '0');

      // Customer order ID
      $res['customer_busi_order_id'] =
         (string) $rsp->children($namespaces['ser'])->CustomerBusiOrderId;

      // Extra parameters
      if (isset($rsp->ExtParamList)) {
         foreach (
            $rsp->ExtParamList->children($namespaces['com'])->ParameterInfo as $p
         ) {
            $res['extra_params'][(string) $p->ParamName]
               = (string) $p->ParamValue;
         }
      }

      /**
       * ✅ POST-SUCCESS BUSINESS LOGIC
       * Update survey order when subscription is successful
       */
      if ($res['success'] && !empty($res['customer_busi_order_id'])) {
         try {
            $surveyOrderId = $data['survey_order_id'] ?? null;

            if ($surveyOrderId) {
               SurveyOrder::where('customer_survey_order_id', $surveyOrderId)
                  ->update([
                     'status' => FFDServiceProvisionStatus::Subscribed->value,
                     'subscribed_at' => now(),
                     'customer_subscription_order_id' => $res['customer_busi_order_id'],
                  ]);
            }
         } catch (\Throwable $e) {
            Log::error('Failed to update survey order after combo subscription', [
               'customer_busi_order_id' => $res['customer_busi_order_id'],
               'survey_order_id' => $data['survey_order_id'] ?? null,
               'error' => $e->getMessage(),
            ]);
            // Don't fail the entire request - subscription was successful
         }
      }

      return $res;
   }
}
