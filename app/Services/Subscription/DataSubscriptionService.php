<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Models\Customer;
use App\Services\ApiResponse;
use App\Services\GetCombiningService;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DataSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   public function __construct(protected readonly GetCombiningService $get_combining_service)
   {
   }

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
      if (Auth::check()) {
         $customer = Customer::current();
         $data['sms_no'] = substr($customer?->phone_number, -9);
         $data['customer_code'] = $customer?->code;
         $data['name'] = $customer?->name;
      } else {
         $data['sms_no'] = substr($data['sms_no'], -9);
         $data['customer_code'] = $data['customer_code'];
         $data['name'] = $data['name'];
      }

      $xml = $this->buildXml($data);
      // Log::info($xml);
      $response = $this->executeRequest($xml);
      // Log::info($response);
      return $this->parseResponse($data, $response);
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

      // Default/demo values (until frontend provides them)
      $data = array_merge($data, [
         'region' => 1,
         'city' => 1,
         'zone' => 3,
         'wereda' => 10,
         'kebele' => 'Kebele',
         'house_no' => '1234',
         'street_name' => 'StreetName',
         'apartment' => 'Apartment',

         'enterprise_name' => 'tet',
         'credit_class' => 'Excellent',
         'payment_mode' => 'CASH',
         'ext_payment_type' => '0',

         'business_code' => 'CO015',
         'external_sequence' => uniqid(),
         'network_type' => '4',
         'cpe_type' => '2701DTU',
         'cpe_serial' => '2',
         'sub_type' => '1',
         'sub_language' => '2002',
         'offering_id' => '1457567289',
         'effective_mode' => '0',
         'sla_priority' => '6',
         'internet_account' => 'ghhur@qq.com',
         'internet_password' => 'REDACTED_PASSWORD',
         'call_center_access' => '994',

         'external_oper_id' => '512',
         'installment_date' => now()->format('YmdHis'),
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
                     <com:StreetName>{$data['street_name']}</com:StreetName>
                     <com:Apartment>{$data['apartment']}</com:Apartment>
                  </com:CustomerAddressInfo>

                  <com:CustomerContactInfo>
                     <com:NotificationMode>2</com:NotificationMode>
                     <com:Email>{$email}</com:Email>
                     <com:MobileNo>{$data['sms_no']}</com:MobileNo>
                  </com:CustomerContactInfo>
               </com:CustomerInfo>

               <com:AccountInfo>
                  <com:PaymentType>1</com:PaymentType>
                  <com:InitialCredit>100</com:InitialCredit>
                  <com:ethioZoneOrRegion>{$data['region']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>2002</com:Language>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:Title>1</com:Title>
                  <com:CreditClass>Excellent</com:CreditClass>
                  <com:GreenList>1</com:GreenList>
                  <com:LateFeeFlag>1</com:LateFeeFlag>
                  <com:AdministrativeRegionCity>{$data['city']}</com:AdministrativeRegionCity>
                  <com:SubcityZone>{$data['zone']}</com:SubcityZone>
                  <com:WeredaTown>{$data['wereda']}</com:WeredaTown>
                  <com:Kebele>{$data['kebele']}</com:Kebele>
                  <com:HouseNo>{$data['house_no']}</com:HouseNo>
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
