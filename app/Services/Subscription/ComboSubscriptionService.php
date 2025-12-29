<?php

namespace App\Services\Subscription;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\Customer;
use App\Models\SurveyOrder;
use App\Services\ApiResponse;
use App\Traits\InteractsWithSMSGateway;
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
      Log::info($xml);
      $response = $this->executeRequest($xml);
      Log::info($response);
      return $this->parseResponse($data, $response);
   }

   public function buildXml(array $data): string
   {
      $cfg = config('services.subscriber');
      $email = $this->generateEmail();

      $depId = "1766044689199549668";
      // fetch from db;
      $this->serviceNumber = $this->queryAvailableNumberService->getAvailableNumberServices($depId);

      if (!$this->serviceNumber) {
         throw new \RuntimeException('Unable to reserve service number');
      }

      $data['service_number'] = $this->serviceNumber;

      $default = [
         'channel_id'            => 35,
         'technical_channel_id'  => 53,
         'tenant_id'             => 101,
         'access_user'           => 'ecaf',
         'access_pwd'            => 'REDACTED_PASSWORD',

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

         'voice_offering_id'     => '1207609454', //FL

         'data_offering_id'      => '1457567289',

         'cpe_type'              => '2701DTU',
         'cpe_serial'            => '2',
         'internet_account'      => 'ghhtuuy@qq.com',
         'internet_password'     => 'REDACTED_PASSWORD',

         'external_oper_id'      => '9527',
         'external_oper_name'    => 'helloworld',
         'installment_date'      => now()->format('YmdHis'),
      ];

      $data = array_merge($data, $default);

      // $data['service_number'] = "980600167";

      Log::info($data);

      return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services">
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
            <!--Optional:-->
            <com:AccessIP>1</com:AccessIP>
            <com:TestFlag>1</com:TestFlag>
            <!--Zero or more repetitions:-->
            <com:AdditionalProperty>
               <com:Code>1</com:Code>
               <com:Value>1</com:Value>
            </com:AdditionalProperty>
         </ser:RequestHeader>
         <ser:CreateNewSubscriberReqBody>
            <!--Optional:-->
            <com:CustomerBusiOrder>
              <com:CustomerSurveyOrderId>{$data['survey_order_id']}</com:CustomerSurveyOrderId>
               <com:CustomerCode>{$data['customer_code']}</com:CustomerCode>
               <com:CustomerInfo>
               <com:SubLanguage>2002</com:SubLanguage>
                  <!--Optional:-->
                  <com:IVRLanguage>2002</com:IVRLanguage>
                  <com:CustomerType>2</com:CustomerType>
                  <com:CustomerCategory>5</com:CustomerCategory>
                  <com:CustomerSubcategory>14</com:CustomerSubcategory>
                  <com:CustomerLevel>2</com:CustomerLevel>
                  <com:CustomerName>aaa</com:CustomerName>
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
                  <com:SecretAnswer>REDACTED_PASSWORD=</com:SecretAnswer>
                  <com:PromotionMessageFlag>2</com:PromotionMessageFlag>
                  <com:CustomerAddressInfo>
                     <com:EthioZoneOrRegion>3</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>1</com:AdministrativeRegionOrCity>
                     <com:SubcityOrZone>1</com:SubcityOrZone>
                     <com:WeredaOrTown>10</com:WeredaOrTown>
                     <com:Kebele>Kebele</com:Kebele>
                     <com:HouseNo>1234</com:HouseNo>
                     <com:StreetName>yuelu</com:StreetName>
                     <com:Apartment>Apartment</com:Apartment>
                  </com:CustomerAddressInfo>
                  <com:CustomerContactInfo>
                     <com:NotificationMode>2</com:NotificationMode>
                     <com:Email>ok@ok.com</com:Email>
                     <com:POBox>123123</com:POBox>
                     <!--Optional:-->
                     <com:ZipCode>123123</com:ZipCode>
                     <!--Optional:-->
                     <com:HomeNo>1234567891</com:HomeNo>
                     <!--Optional:-->
                     <com:OfficeNo>112312311</com:OfficeNo>
                     <!--Optional:-->
                     <com:MobileNo>068485484</com:MobileNo>
                     <!--Optional:-->
                     <com:FaxNo>213352323</com:FaxNo>
                  </com:CustomerContactInfo>
                  <com:CustomerContactPersonInfoList>
                     <!--1 or more repetitions:-->
                     <com:ContactPersonInfo>
                        <com:FirstName>zhang</com:FirstName>
                        <com:MiddleName>san</com:MiddleName>
                        <com:LastName>feng</com:LastName>
                        <com:Title>1</com:Title>
                        <!--Optional:-->
                        <com:HomeNo>123456789</com:HomeNo>
                        <!--Optional:-->
                        <com:OfficeNo>119113119</com:OfficeNo>
                        <!--Optional:-->
                        <com:MobileNo>065484145</com:MobileNo>
                        <!--Optional:-->
                        <com:FaxNo>123123141</com:FaxNo>
                     </com:ContactPersonInfo>
                  </com:CustomerContactPersonInfoList>
               </com:CustomerInfo>
               <com:AccountInfo>
                  <!--Optional:-->
                  <!--Optional:-->
                  <com:PaymentType>1</com:PaymentType>
                  <!--Optional:-->
                  <com:BillCycle>01</com:BillCycle>
                  <!--Optional:-->
                  <com:InitialCredit>100</com:InitialCredit>
                  <com:ethioZoneOrRegion>3</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>2002</com:Language>
                  <!--Optional:><com:FirstName>liu</com:FirstName><com:MiddleOrFatherName>chuan</com:MiddleOrFatherName><com:LastName>feng</com:LastName-->
                  <com:EnterpriseCustomerName>feng</com:EnterpriseCustomerName>
                  <com:Title>1</com:Title>
                  <com:CreditClass>Excellent</com:CreditClass>
                  <!--Optional:1: Yes 0: No-->
                  <com:GreenList>1</com:GreenList>
                  <!--Optional:-->
                  <com:LateFeeFlag>1</com:LateFeeFlag>
                  <!--Optional:-->
                  <com:TaxExemptionFlag>1</com:TaxExemptionFlag>
                  <com:AdministrativeRegionCity>1</com:AdministrativeRegionCity>
                  <com:SubcityZone>1</com:SubcityZone>
                  <com:WeredaTown>2</com:WeredaTown>
                  <com:Kebele>Kebele</com:Kebele>
                  <!--Optional:-->
                  <com:HouseNo>1234</com:HouseNo>
                  <!--Optional:-->
                  <com:StreetName>StreetName</com:StreetName>
                  <!--Optional:-->
                  <com:Apartment>Apartment</com:Apartment>
                  <!--Optional:-->
                  <com:POBox>1231231</com:POBox>
                  <!--Optional:-->
                  <com:SMSNo>12141231</com:SMSNo>
                  <!--Optional:-->
                  <com:Email>ok@ok.com</com:Email>
                  <!--Optional:-->
                  <com:FaxNo>010-123141231</com:FaxNo>
                  <!--Optional:-->
                  <com:Postcode>123456</com:Postcode>
                  <!--Optional:-->
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
                  <com:SubType>1</com:SubType>
                  <com:ServiceNumber>{$data['service_number']}</com:ServiceNumber>
                  <!--Optional:  21：GSM 22：CDMA  3：ADSL  4：FIX  固话-->
                  <com:NetworkType>4</com:NetworkType>
                  <!--Optional:  0:Prepaid  1:Postpaid  3:Hybrid.-->
                  <com:SubType>1</com:SubType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>1207609454</com:OfferingId>
                           <com:ServiceNumber>123789896</com:ServiceNumber>
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
            <com:InstallmentCompletedDate>{$data['installment_date']}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
 
XML;
   }

   protected function parseResponse(array $data, string $xml): array
   {
      libxml_use_internal_errors(true); // suppress XML parsing warnings

      $responseData = [
         'success' => false,
         'ret_code' => null,
         'ret_msg' => null,
         'customer_busi_order_id' => null,
         'extra_params' => [],
      ];

      try {
         $xmlObject = simplexml_load_string($xml, "SimpleXMLElement", LIBXML_NOCDATA);
         if (!$xmlObject) {
            throw new \RuntimeException('Invalid XML response');
         }

         $body = $xmlObject->children('soapenv', true)->Body ?? null;
         if (!$body) return $responseData;

         $rspMsg = $body->children('ser', true)->CreateNewSubscriberRspMsg ?? null;
         if (!$rspMsg) return $responseData;

         $header = $rspMsg->ResponseHeader ?? null;
         if ($header) {
            $responseData['ret_code'] = (string) $header->RetCode;
            $responseData['ret_msg'] = (string) $header->RetMsg;
            $responseData['success'] = ((string) $header->RetCode === '0');
         }

         $responseData['customer_busi_order_id'] = (string) $rspMsg->CustomerBusiOrderId;

         // Parse ExtParamList (like FBBNUMBER)
         if (isset($rspMsg->ExtParamList) && isset($rspMsg->ExtParamList->ParameterInfo)) {
            foreach ($rspMsg->ExtParamList->ParameterInfo as $param) {
               $name  = (string) $param->ParamName;
               $value = (string) $param->ParamValue;
               $responseData['extra_params'][$name] = $value;
            }
         }
      } catch (\Throwable $e) {
         \Log::error('Error parsing XML response: ' . $e->getMessage());
      }

      return $responseData;
   }
}
