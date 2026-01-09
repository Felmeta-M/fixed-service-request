<?php

namespace App\Services\Subscription;

use App\Models\Customer;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ComboSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
    public function __construct(
        protected readonly QueryAvailableNumberService $queryAvailableNumberService,
        protected readonly ReserveNumberService $reserveNumberService,
    ) {}

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

        return $this->parseResponse($response);
    }

    /**
     * FRONTEND > DEFAULT
     * Never misses any XML field
     */
    private function normalize(array $payload): array
    {
        $customer = Auth::check() ? Customer::current() : null;

        $serviceNumber = $this->queryAvailableNumberService
            ->getAvailableNumberServices('1766044689199549668');

        if (!$serviceNumber) {
            throw new \RuntimeException('Unable to reserve service number');
        }

        $email = $this->generateEmail();

        $defaults = [

            'header' => [
                'version'              => 1,
                'transaction_id'       => $this->transactionId(),
                'session_id'           => 1,
                'process_time'         => $this->processTime(),
                'contact_id'           => 1,
                'language'             => 2002,
                'channel_id'           => 35,
                'technical_channel_id' => 53,
                'tenant_id'            => 101,
                'access_user'          => 'ecaf',
                'access_pwd'           => 'REDACTED_PASSWORD',
                'access_ip'            => 1,
                'test_flag'            => 1,
            ],

            'survey_order_id' => null,

            'customer' => [
                'code'  => $customer?->code,
                'name'  => $customer?->name ?? $payload['name'],
            ],

            //TODO: Add real customer address data from payload or query from database
            'address' => [
                'region' => 3,
                'city'   => 1,
                'zone'   => 1,
                'wereda' => 10,
                'kebele' => 'Kebele',
                'house_no' => '1234',
                'street'  => 'yuelu',
                'apartment' => 'Apartment',
            ],

            'account' => [
                'payment_type' => 1,
                'bill_cycle'   => '01',
                'initial_credit' => 100,
                'collection_center' => '10172',
                'enterprise_name' => 'feng',
            ],

            'combo' => [
                'group_offering_id' => 180427974,
                'voice_offering_id' => 1207609454,
                'data_offering_id'  => 1457567289,
                'cpe_type'   => '2701DTU',
                'cpe_serial' => '2',
            ],

            'internet' => [
                'account'  => $email,
                'password' => 'REDACTED_PASSWORD',
            ],

            'meta' => [
                'external_seq' => now()->format('YmdHis'),
                'install_date' => now()->format('YmdHis'),
            ],

            'operator' => [
                'id'   => '9527',
                'name' => 'helloworld',
            ],

            'service_number' => $serviceNumber,
        ];

        return array_replace_recursive($defaults, $payload);
    }

    /**
     * FULL XML — NOTHING OMITTED
     */
//     private function buildXml(array $d): string
//     {
//         return <<<XML
// <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
//                   xmlns:ser="http://oss.huawei.com/webservice/bss/services"
//                   xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
// <soapenv:Header/>
// <soapenv:Body>
// <ser:CreateNewSubscriberReqMsg>

// <ser:RequestHeader>
//  <com:Version>{$d['header']['version']}</com:Version>
//  <com:TransactionId>{$d['header']['transaction_id']}</com:TransactionId>
//  <com:SessionId>{$d['header']['session_id']}</com:SessionId>
//  <com:ProcessTime>{$d['header']['process_time']}</com:ProcessTime>
//  <com:ContactId>{$d['header']['contact_id']}</com:ContactId>
//  <com:Language>{$d['header']['language']}</com:Language>
//  <com:ChannelId>{$d['header']['channel_id']}</com:ChannelId>
//  <com:TechnicalChannelId>{$d['header']['technical_channel_id']}</com:TechnicalChannelId>
//  <com:TenantId>{$d['header']['tenant_id']}</com:TenantId>
//  <com:AccessUser>{$d['header']['access_user']}</com:AccessUser>
//  <com:AccessPwd>{$d['header']['access_pwd']}</com:AccessPwd>
//  <com:AccessIP>{$d['header']['access_ip']}</com:AccessIP>
//  <com:TestFlag>{$d['header']['test_flag']}</com:TestFlag>
// </ser:RequestHeader>

// <ser:CreateNewSubscriberReqBody>

// <com:CustomerBusiOrder>
//  <com:CustomerSurveyOrderId>{$d['survey_order_id']}</com:CustomerSurveyOrderId>
//  <com:CustomerCode>{$d['customer']['code']}</com:CustomerCode>
//  <com:IsCombo>1</com:IsCombo>
// </com:CustomerBusiOrder>

// <com:SubBusiOrderlist>
//  <com:BusinessCode>CO015</com:BusinessCode>
//  <com:GroupSubInfo>
//    <com:ExternalSequnce>{$d['meta']['external_seq']}</com:ExternalSequnce>
//    <com:PrimaryOffering>
//      <com:NewPrimaryOffering>
//        <com:OfferingId>
//          <com:OfferingId>{$d['combo']['group_offering_id']}</com:OfferingId>
//        </com:OfferingId>
//      </com:NewPrimaryOffering>
//      <com:EffectiveMode>0</com:EffectiveMode>
//      <com:InstanceProperty>
//        <com:PropertyCode>50135</com:PropertyCode>
//        <com:PropertyType>1</com:PropertyType>
//        <com:Value>{$d['combo']['cpe_type']}</com:Value>
//      </com:InstanceProperty>
//      <com:InstanceProperty>
//        <com:PropertyCode>50134</com:PropertyCode>
//        <com:PropertyType>1</com:PropertyType>
//        <com:Value>{$d['combo']['cpe_serial']}</com:Value>
//      </com:InstanceProperty>
//    </com:PrimaryOffering>
//  </com:GroupSubInfo>
// </com:SubBusiOrderlist>

// <com:SubBusiOrderlist>
//  <com:BusinessCode>CO015</com:BusinessCode>
//  <com:SubscriberInfo>
//    <com:SubType>1</com:SubType>
//    <com:ServiceNumber>{$d['service_number']}</com:ServiceNumber>
//    <com:NetworkType>4</com:NetworkType>
//    <com:PrimaryOffering>
//      <com:NewPrimaryOffering>
//        <com:OfferingId>
//          <com:OfferingId>{$d['combo']['voice_offering_id']}</com:OfferingId>
//        </com:OfferingId>
//      </com:NewPrimaryOffering>
//    </com:PrimaryOffering>
//  </com:SubscriberInfo>
// </com:SubBusiOrderlist>

// <com:SubBusiOrderlist>
//  <com:BusinessCode>CO015</com:BusinessCode>
//  <com:SubscriberInfo>
//    <com:SubType>0</com:SubType>
//    <com:PrimaryOffering>
//      <com:NewPrimaryOffering>
//        <com:OfferingId>
//          <com:OfferingId>{$d['combo']['data_offering_id']}</com:OfferingId>
//        </com:OfferingId>
//      </com:NewPrimaryOffering>
//    </com:PrimaryOffering>
//    <com:InternetAccount>{$d['internet']['account']}</com:InternetAccount>
//    <com:InternetPassword>{$d['internet']['password']}</com:InternetPassword>
//  </com:SubscriberInfo>
// </com:SubBusiOrderlist>

// <com:ExternalOperid>{$d['operator']['id']}</com:ExternalOperid>
// <com:ExternalOperName>{$d['operator']['name']}</com:ExternalOperName>
// <com:InstallmentCompletedDate>{$d['meta']['install_date']}</com:InstallmentCompletedDate>

// </ser:CreateNewSubscriberReqBody>
// </ser:CreateNewSubscriberReqMsg>
// </soapenv:Body>
// </soapenv:Envelope>
// XML;
//     }


protected function buildXml(array $data) 
{
  $customer = Auth::check() ? Customer::current() : null;

  $data['customer_code'] = $customer ? $customer->code : $data['customer_code'];

  $serviceNumber = $this->queryAvailableNumberService
      ->getAvailableNumberServices('1766044689199549668');

  if (!$serviceNumber) {
      throw new \RuntimeException('Unable to reserve service number');
  }

  $email = $data['email'] ?? $this->generateEmail(); //TODO: Add real email from payload or query from database

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
            <!--Optional:-->
            <com:ContactId>1</com:ContactId>
            <!--Optional:-->
            <com:Language>2002</com:Language>
            <com:ChannelId>35</com:ChannelId>
            <com:TechnicalChannelId>53</com:TechnicalChannelId>
            <!--Optional:-->
            <com:TenantId>101</com:TenantId>
           <com:AccessUser>ecaf</com:AccessUser>
            <com:AccessPwd>REDACTED_PASSWORD</com:AccessPwd> 
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
                     <com:Email>{$email}</com:Email>
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
            <com:InstallmentCompletedDate>20260109000000</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
}

    /**
     * Namespace-safe response parsing
     */protected function parseResponse(string $xml): array
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
   $res['ret_msg']  = (string) $header->RetMsg;
   $res['success']  = ((string) $header->RetCode === '0');

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

   return $res;
}

}
