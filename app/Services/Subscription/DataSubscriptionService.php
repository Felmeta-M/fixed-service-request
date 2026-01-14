<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\ApiResponse;
use App\Services\GetCombiningService;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Support\Facades\Log;

class DataSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   public function __construct(protected readonly GetCombiningService $get_combining_service) {}

   protected function offeringId(): int
   {
      return 1457567289; // FBB OR DATA
   }

   protected function businessCode(): string
   {
      return 'CO015';
   }

   protected function networkType(): int
   {
      return 3; // matches actual XML
   }

   public function create(array $data)
   {
      // Use shared helper to hydrate customer data
      $data = $this->hydrateWithCustomerData($data);

      $xml = $this->buildXml($data);
      $response = $this->executeRequest($xml);
      return $this->parseResponse($response, $data);
   }

   public function getSubscriber(array $responseData): array
   {
      if (empty($responseData['success']) || $responseData['success'] !== true) {
         throw new \RuntimeException('API call failed: ' . ($responseData['message'] ?? 'Unknown error'));
      }

      $subscriber = data_get($responseData, 'data');
      // Log::info($subscriber);

      if (empty($subscriber)) {
         throw new \RuntimeException('Subscriber not found in API response.');
      }

      return $subscriber;
   }

   protected function buildXml(array $data): string
   {
      $email = $this->generateEmail();

      $cfg = config('services.subscriber');
      $cfg['default_password'] = 'REDACTED_PASSWORD';

      // Get dynamic customer profile, address, and BSS classification from logged-in user
      $profile = $this->getCustomerProfile($data);
      $address = $this->getCustomerAddress($data);
      $bss = $this->getBssClassification($data);

      // Business defaults
      $data = array_merge($data, [
         'street_name' => 'StreetName',
         'apartment' => 'Apartment',
         'enterprise_name' => $profile['name'] ?? 'Customer',
         'credit_class' => $bss['credit_class'],
         'payment_mode' => 'CASH',
         'ext_payment_type' => '0',
         'business_code' => 'CO015',
         'external_sequence' => uniqid(),
         'network_type' => '4',
         'cpe_type' => '2701DTU',
         'cpe_serial' => '2',
         'sub_type' => '1',
         'sub_language' => $profile['primary_language'],
         'offering_id' => '1457567289',
         'effective_mode' => '0',
         'sla_priority' => '6',
         'internet_account' => $email,
         'internet_password' => 'REDACTED_PASSWORD',
         'call_center_access' => '994',
         'external_oper_id' => '512',
         'installment_date' => $this->completedDate(),
      ]);

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
            <com:Language>{$profile['primary_language']}</com:Language>
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
               <com:CustomerCode>{$this->customerCode($data['customer_code'] ?? null)}</com:CustomerCode>
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
                     <com:EthioZoneOrRegion>{$address['region']}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$address['city']}</com:AdministrativeRegionOrCity>
                     <com:SubcityOrZone>{$address['zone']}</com:SubcityOrZone>
                     <com:WeredaOrTown>{$address['wereda']}</com:WeredaOrTown>
                     <com:Kebele>{$address['kebele']}</com:Kebele>
                     <com:HouseNo>{$address['house_no']}</com:HouseNo>
                     <com:StreetName>{$data['street_name']}</com:StreetName>
                     <com:Apartment>{$data['apartment']}</com:Apartment>
                  </com:CustomerAddressInfo>

                  <com:CustomerContactInfo>
                     <com:NotificationMode>{$bss['notification_mode']}</com:NotificationMode>
                     <com:Email>{$email}</com:Email>
                     <com:MobileNo>{$data['sms_no']}</com:MobileNo>
                  </com:CustomerContactInfo>
               </com:CustomerInfo>

               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:InitialCredit>100</com:InitialCredit>
                  <com:ethioZoneOrRegion>{$address['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>{$profile['primary_language']}</com:Language>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:Title>{$profile['title']}</com:Title>
                  <com:CreditClass>{$bss['credit_class']}</com:CreditClass>
                  <com:GreenList>1</com:GreenList>
                  <com:LateFeeFlag>1</com:LateFeeFlag>
                  <com:AdministrativeRegionCity>{$address['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$address['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$address['wereda']}</com:WeredaTown>
                  <com:Kebele>{$address['kebele']}</com:Kebele>
                  <com:HouseNo>{$address['house_no']}</com:HouseNo>
                  <com:StreetName>{$data['street_name']}</com:StreetName>
                  <com:Apartment>{$data['apartment']}</com:Apartment>
                  <com:SMSNo>{$data['sms_no']}</com:SMSNo>
                  <com:Email>{$email}</com:Email>
                  <com:PaymentMode>
                     <com:PaymentMode>{$data['payment_mode']}</com:PaymentMode>
                  </com:PaymentMode>
               </com:AccountInfo>
            </com:CustomerBusiOrder>

            <com:SubBusiOrderlist>
               <com:BusinessCode>{$this->businessCode()}</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:SubType>1</com:SubType>
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$this->offeringId()}</com:OfferingId>
                        </com:OfferingId>
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

                     </com:NewPrimaryOffering>
                  </com:PrimaryOffering>

                  <com:SLAPriority>6</com:SLAPriority>
                  <com:InternetAccount>{$email}</com:InternetAccount>
                  <com:InternetPassword>{$cfg['default_password']}</com:InternetPassword>
                  <com:CallCenterAccess>994</com:CallCenterAccess>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>

            <com:ExternalOperid>{$data['external_oper_id']}</com:ExternalOperid>
            <com:InstallmentCompletedDate>{$data['installment_date']}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
   }


   protected function parseResponse(string $xml, array $data): array
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

      $namespaces = $obj->getNamespaces(true);

      // SOAP Body
      $body = $obj->children($namespaces['soapenv'])->Body ?? null;
      if (!$body) {
         return $res;
      }

      // Huawei response
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
      $res['success'] = ($res['ret_code'] === '0');

      // Customer business order ID
      $res['customer_busi_order_id'] =
         (string) $rsp->children($namespaces['ser'])->CustomerBusiOrderId;

      // Extra parameters (FBBNUMBER, etc.)
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
       * Runs BEFORE return $res;
       */
      if ($res['success']) {

         $serviceNo = $res['extra_params']['FBBNUMBER'] ?? null;

         if (empty($serviceNo)) {
            Log::error('Huawei success response missing FBBNUMBER', [
               'response' => $res,
            ]);

            return $res;
         }

         // Update SurveyOrder
         SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'])
            ->update([
               'service_number' => $serviceNo,
               'status' => FFDServiceProvisionStatus::Subscribed->value,
               'subscribed_at' => now(),
            ]);

         // Send SMS
         if (
            !empty($data['sms_no']) &&
            InteractsWithSMSGateway::ensurePhoneIsLocal($data['sms_no'])
         ) {
            $phone = $data['sms_no'];

            try {
               $name = trim(explode(' ', $data['name'] ?? 'Customer')[0]);

               $message = "Dear {$name}, thank you for choosing Ethio Telecom. "
                  . "We are pleased to inform you that your subscription has been successfully created. "
                  . "Your service number is {$serviceNo}. "
                  . "For support or to submit a TT/complaint, please visit "
                  . "https://fixedservices.ethiotelecom.et/services.";

               InteractsWithSMSGateway::sendSmsOnly($phone, $message);
            } catch (\RuntimeException $e) {
               Log::warning('Subscription SMS blocked or rate-limited', [
                  'phone' => $phone,
                  'reason' => $e->getMessage(),
               ]);
            } catch (\Throwable $e) {
               Log::error('Failed to send subscription SMS', [
                  'phone' => $phone,
                  'error' => $e->getMessage(),
               ]);
            }
         }
      }

      return $res;
   }
}
