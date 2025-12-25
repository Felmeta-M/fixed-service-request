<?php

namespace App\Services\Subscription;

use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ComboSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   protected function offeringId(): int
   {
      return 1457567289; // FBB OR DATA
   }

   protected function businessCode(): string
   {
      return '';
   }

   protected function networkType(): int
   {
      return 1; // matches actual XML
   }

   public function create(array $data)
   {
      if (Auth::check()) {
         $customer = Customer::current();
         $data['sms_no'] = substr($customer?->phone_number, -9);
         $data['customer_code'] = $customer?->code;
         $data['name'] = $customer?->name;
      } else {
         $data['sms_no'] = substr($data['sms_no'], -9);
         $data['customer_code'] =  $data['customer_code'];
         $data['name'] =  $data['name'];
      }

      $xml = $this->buildXml($data);
      // Log::info($xml);
      $response = $this->executeRequest($xml);
      Log::info($response);
      return $this->parseResponse($data, $response);
   }

   public function buildXml(array $data): string
   {
      $cfg = config('services.subscriber');
      $email = $this->generateEmail();

      $default = [
         'channel_id'            => 35,
         'technical_channel_id'  => 53,
         'tenant_id'             => 101,
         'access_user'           => 'ecaf',
         'access_pwd'            => 'REDACTED_PASSWORD',

         'survey_order_id'       => '20000455487924',
         'customer_code'         => '828285101',
         'customer_name'         => 'aaa',
         'secret_answer'         => 'REDACTED_PASSWORD=',

         'region'                => 3,
         'city'                  => 1,
         'zone'                  => 1,
         'wereda'                => 10,
         'kebele'                => 'Kebele',
         'house_no'              => '1234',
         'street_name'           => 'yuelu',
         'apartment'             => 'Apartment',

         'email'                 => 'ok@ok.com',
         'mobile_no'             => '068485484',

         'enterprise_name'       => 'feng',

         'external_sequence'     => now()->format('YmdHis'),
         'group_offering_id'     => '180427974', // group offer

         'service_number'        => '123789896', // query available number by region mapping
         'voice_offering_id'     => '1207609454', //FL

         'data_offering_id'      => '1457567289',

         'cpe_type'              => '2701DTU',
         'cpe_serial'            => '2',
         'internet_account'      => 'ghhtuuy@qq.com',
         'internet_password'     => 'REDACTED_PASSWORD',

         'external_oper_id'      => '9527',
         'external_oper_name'    => 'helloworld',
         'installment_date'      => '20251223000000',
      ];

      $data = array_merge($data, $default);


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
                  <com:SubLanguage>2002</com:SubLanguage>
                  <com:IVRLanguage>2002</com:IVRLanguage>
                  <com:CustomerType>2</com:CustomerType>
                  <com:CustomerCategory>5</com:CustomerCategory>
                  <com:CustomerSubcategory>14</com:CustomerSubcategory>
                  <com:CustomerLevel>2</com:CustomerLevel>
                  <com:CustomerName>{$data['customer_name']}</com:CustomerName>
                  <com:BranchName>BranchName</com:BranchName>
                  <com:Title>1</com:Title>
                  <com:Nationality>1</com:Nationality>
                  <com:IdentificationType>5</com:IdentificationType>
                  <com:IdentificationNumber>2022112233</com:IdentificationNumber>
                  <com:VATRegNo>123456</com:VATRegNo>
                  <com:Gender>1</com:Gender>
                  <com:DateofBirth>19660612</com:DateofBirth>
                  <com:PlaceofBirth>1966</com:PlaceofBirth>
                  <com:Occupation>1</com:Occupation>
                  <com:Education>1</com:Education>
                  <com:Religion>1</com:Religion>
                  <com:Income>7</com:Income>
                  <com:Hobbies>Sport</com:Hobbies>
                  <com:PrimaryLanguage>2002</com:PrimaryLanguage>
                  <com:SecondaryLanguage>2060</com:SecondaryLanguage>
                  <com:SecretQuestion>1</com:SecretQuestion>
                  <com:SecretAnswer>{$data['secret_answer']}</com:SecretAnswer>
                  <com:PromotionMessageFlag>2</com:PromotionMessageFlag>

                  <com:CustomerAddressInfo>
                     <com:EthioZoneOrRegion>{$data['region']}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$data['city']}</com:AdministrativeRegionOrCity>
                     <com:SubcityOrZone>{$data['zone']}</com:SubcityOrZone>
                     <com:WeredaOrTown>{$data['wereda']}</com:WeredaOrTown>
                     <com:Kebele>{$data['kebele']}</com:Kebele>
                     <com:HouseNo>{$data['house_no']}</com:HouseNo>
                     <com:StreetName>{$data['street_name']}</com:StreetName>
                     <com:Apartment>{$data['apartment']}</com:Apartment>
                  </com:CustomerAddressInfo>

                  <com:CustomerContactInfo>
                     <com:NotificationMode>2</com:NotificationMode>
                     <com:Email>{$data['email']}</com:Email>
                     <com:POBox>123123</com:POBox>
                     <com:ZipCode>123123</com:ZipCode>
                     <com:HomeNo>1234567891</com:HomeNo>
                     <com:OfficeNo>112312311</com:OfficeNo>
                     <com:MobileNo>{$data['mobile_no']}</com:MobileNo>
                     <com:FaxNo>213352323</com:FaxNo>
                  </com:CustomerContactInfo>

                  <com:CustomerContactPersonInfoList>
                     <com:ContactPersonInfo>
                        <com:FirstName>zhang</com:FirstName>
                        <com:MiddleName>san</com:MiddleName>
                        <com:LastName>feng</com:LastName>
                        <com:Title>1</com:Title>
                        <com:MobileNo>065484145</com:MobileNo>
                     </com:ContactPersonInfo>
                  </com:CustomerContactPersonInfoList>

               </com:CustomerInfo>

               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:BillCycle>01</com:BillCycle>
                  <com:InitialCredit>100</com:InitialCredit>
                  <com:ethioZoneOrRegion>{$data['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>2002</com:Language>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:Title>1</com:Title>
                  <com:CreditClass>Excellent</com:CreditClass>
                  <com:GreenList>1</com:GreenList>
                  <com:LateFeeFlag>1</com:LateFeeFlag>
                  <com:TaxExemptionFlag>1</com:TaxExemptionFlag>
                  <com:AdministrativeRegionCity>{$data['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$data['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$data['wereda']}</com:WeredaTown>
                  <com:Kebele>{$data['kebele']}</com:Kebele>
                  <com:HouseNo>{$data['house_no']}</com:HouseNo>
                  <com:StreetName>{$data['street_name']}</com:StreetName>
                  <com:Apartment>{$data['apartment']}</com:Apartment>
                  <com:SMSNo>{$data['mobile_no']}</com:SMSNo>
                  <com:Email>{$data['email']}</com:Email>
                  <com:PaymentMode>
                     <com:PaymentMode>CASH</com:PaymentMode>
                  </com:PaymentMode>
               </com:AccountInfo>

               <com:IsCombo>1</com:IsCombo>
            </com:CustomerBusiOrder>

            <!-- ================= GROUP SUB ================= -->
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <com:GroupSubInfo>
                  <com:ExternalSequnce>{$data['external_sequence']}</com:ExternalSequnce>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$data['group_offering_id']}</com:OfferingId>
                        </com:OfferingId>
                     </com:NewPrimaryOffering>
                     <com:EffectiveMode>0</com:EffectiveMode>
                  </com:PrimaryOffering>
               </com:GroupSubInfo>
            </com:SubBusiOrderlist>

            <!-- ================= VOICE SUB ================= -->
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:SubType>1</com:SubType>
                  <com:ServiceNumber>{$data['service_number']}</com:ServiceNumber>
                  <com:NetworkType>4</com:NetworkType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$data['voice_offering_id']}</com:OfferingId>
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

            <!-- ================= DATA / FBB SUB ================= -->
            <com:SubBusiOrderlist>
               <com:BusinessCode>CO015</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:SubType>0</com:SubType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$data['data_offering_id']}</com:OfferingId>
                        </com:OfferingId>
                     </com:NewPrimaryOffering>
                  </com:PrimaryOffering>
                  <com:SLAPriority>0</com:SLAPriority>
                  
                  <com:InstanceProperty>
                     <com:PropertyCode>50135</com:PropertyCode>
                     <com:PropertyType>1</com:PropertyType>
                     <com:Value>{$data['cpe_type']}</com:Value>
                  </com:InstanceProperty>
                  <com:InstanceProperty>
                     <com:PropertyCode>50134</com:PropertyCode>
                     <com:PropertyType>1</com:PropertyType>
                     <com:Value>{$data['cpe_serial']}</com:Value>
                  </com:InstanceProperty>

                  <com:InternetAccount>{$email}</com:InternetAccount>
                  <com:InternetPassword>{$data['internet_password']}</com:InternetPassword>
                  <com:CallCenterAccess>980,894</com:CallCenterAccess>
                  <com:GreenFlag>1</com:GreenFlag>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>

            <com:ExternalOperid>{$data['external_oper_id']}</com:ExternalOperid>
            <com:ExternalOperName>{$data['external_oper_name']}</com:ExternalOperName>
            <com:InstallmentCompletedDate>{$data['installment_date']}</com:InstallmentCompletedDate>

         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }

   protected function parseResponse(array $data, string $xml) {}
}
