<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\ApiResponse;
use App\Services\GetCombiningService;
use App\Services\Logging\AppLogger;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Support\Facades\DB;

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
      // Check if survey order is already subscribed (prevent duplicate subscriptions)
      $surveyOrder = SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'])
         ->first();

      if (!$surveyOrder) {
         throw new \RuntimeException('Survey order not found: ' . $data['survey_order_id']);
      }

      if ($surveyOrder->status === FFDServiceProvisionStatus::Completed->value) {
         AppLogger::api()->warning('Attempted duplicate subscription', [
            'survey_order_id' => $data['survey_order_id'],
            'current_status' => $surveyOrder->status,
         ]);

         return [
            'success' => false,
            'ret_code' => 'DUPLICATE',
            'ret_msg' => 'This survey order has already been used to create a subscription.',
            'customer_busi_order_id' => null,
            'extra_params' => [],
         ];
      }

      // Use shared helper to hydrate customer data
      $data = $this->hydrateWithCustomerData($data);

      // Add with_device flag from survey order for conditional XML generation
      $data['with_device'] = $surveyOrder->with_device ?? false;

      $xml = $this->buildXml($data);
      AppLogger::api()->info('Data subscription XML', [
         'xml' => $xml,
         'survey_order_id' => $data['survey_order_id'],
         'service_type' => 'data',
      ]);
      $response = $this->executeRequest($xml);
      $parsedResponse = $this->parseResponse($response, $data);
      return $parsedResponse;
   }

   public function getSubscriber(array $responseData): array
   {
      if (empty($responseData['success']) || $responseData['success'] !== true) {
         throw new \RuntimeException('API call failed: ' . ($responseData['message'] ?? 'Unknown error'));
      }

      $subscriber = data_get($responseData, 'data');
      // AppLogger::api()->info($subscriber);

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
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $bss = $this->getBssClassification();

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
         'sub_language' => '2002',
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
                     <com:EthioZoneOrRegion>{$address['ethio_zone']}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$address['region']}</com:AdministrativeRegionOrCity>
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
                  <com:ethioZoneOrRegion>{$address['ethio_zone']}</com:ethioZoneOrRegion>
                  <com:CollectionCenter>10172</com:CollectionCenter>
                  <com:Language>{$profile['primary_language']}</com:Language>
                  <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
                  <com:Title>{$profile['title']}</com:Title>
                  <com:CreditClass>{$bss['credit_class']}</com:CreditClass>
                  <com:GreenList>1</com:GreenList>
                  <com:LateFeeFlag>1</com:LateFeeFlag>
                  <com:AdministrativeRegionCity>{$address['region']}</com:AdministrativeRegionCity>
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
                  <com:SubLanguage>{$profile['primary_language']}</com:SubLanguage>
                  
                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$this->offeringId()}</com:OfferingId>
                        </com:OfferingId>
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
                     </com:NewPrimaryOffering>
                  </com:PrimaryOffering>

                  {$this->buildSupplementaryOfferingList($data)}

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


   /**
    * Builds the SupplementaryOfferingList XML section conditionally based on with_device flag.
    *
    * @param array $data
    * @return string
    */
   protected function buildSupplementaryOfferingList(array $data): string
   {
      $withDevice = (bool) ($data['with_device'] ?? false);

      if (!$withDevice) {
         return '';
      }

      return <<<XML
                  <com:SupplementaryOfferingList>
                     <com:OfferingInstance>
                        <com:OfferingId>
                           <com:OfferingId>1827012365</com:OfferingId>
                        </com:OfferingId>
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
                     </com:OfferingInstance>
                     <com:EffectiveMode>0</com:EffectiveMode>
                  </com:SupplementaryOfferingList>
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

      $surveyOrderId = $data['survey_order_id'] ?? null;

      try {
         libxml_use_internal_errors(true);
         $obj = simplexml_load_string($xml);

         if ($obj === false) {
            $errors = array_map(fn($e) => $e->message, libxml_get_errors());
            libxml_clear_errors();

            AppLogger::api()->error('Failed to parse data subscription XML response', [
               'xml_preview' => substr($xml, 0, 500),
               'errors' => $errors,
               'survey_order_id' => $surveyOrderId,
               'service_type' => 'data',
            ]);
            return $res;
         }

         // Use hardcoded namespace URIs for reliability (namespaces may be declared in child elements)
         $soapNs = 'http://schemas.xmlsoap.org/soap/envelope/';
         $serNs = 'http://oss.huawei.com/webservice/bss/services';
         $comNs = 'http://www.huawei.com/bss/soaif/interface/common/';

         // SOAP Body
         $body = $obj->children($soapNs)->Body ?? null;
         if (!$body) {
            AppLogger::api()->error('Missing SOAP Body in data subscription response', [
               'survey_order_id' => $surveyOrderId,
               'service_type' => 'data',
            ]);
            return $res;
         }

         // Huawei response
         $rsp = $body->children($serNs)->CreateNewSubscriberRspMsg ?? null;
         if (!$rsp) {
            AppLogger::api()->error('Missing CreateNewSubscriberRspMsg in data subscription response', [
               'survey_order_id' => $surveyOrderId,
               'service_type' => 'data',
            ]);
            return $res;
         }

         // Get ser: namespace children for accessing ResponseHeader, CustomerBusiOrderId, ExtParamList
         $serChildren = $rsp->children($serNs);

         // Response header (ser:ResponseHeader)
         $header = $serChildren->ResponseHeader ?? null;
         if (!$header) {
            AppLogger::api()->error('Missing ResponseHeader in data subscription response', [
               'survey_order_id' => $surveyOrderId,
               'service_type' => 'data',
            ]);
            return $res;
         }

         // Header data is in com: namespace (com:RetCode, com:RetMsg)
         $headerData = $header->children($comNs);
         $res['ret_code'] = (string) ($headerData->RetCode ?? '');
         $res['ret_msg'] = (string) ($headerData->RetMsg ?? '');
         $res['success'] = ($res['ret_code'] == '0');

         // Customer business order ID (ser:CustomerBusiOrderId)
         $res['customer_busi_order_id'] = (string) ($serChildren->CustomerBusiOrderId ?? '');

         // Extra parameters (ser:ExtParamList containing com:ParameterInfo)
         $extParamList = $serChildren->ExtParamList ?? null;
         if ($extParamList) {
            $paramInfos = $extParamList->children($comNs)->ParameterInfo ?? [];
            foreach ($paramInfos as $p) {
               // ParamName and ParamValue are also in com: namespace
               $pChildren = $p->children($comNs);
               $paramName = (string) ($pChildren->ParamName ?? '');
               $paramValue = (string) ($pChildren->ParamValue ?? '');
               if ($paramName) {
                  $res['extra_params'][$paramName] = $paramValue;
               }
            }
         }

         /**
          * ✅ POST-SUCCESS BUSINESS LOGIC
          * Runs BEFORE return $res;
          */
         if ($res['success']) {

            $serviceNo = $res['extra_params']['FBBNUMBER'] ?? null;

            if (empty($serviceNo)) {
               AppLogger::api()->error('Data subscription success response missing FBBNUMBER', [
                  'ret_code' => $res['ret_code'],
                  'customer_busi_order_id' => $res['customer_busi_order_id'],
                  'survey_order_id' => $surveyOrderId,
                  'service_type' => 'data',
               ]);

               return $res;
            }

            // Update SurveyOrder
            try {
               $updated = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)
                  ->update([
                     'service_number' => $serviceNo,
                     'status' => FFDServiceProvisionStatus::Waiting->value,
                     'subscribed_at' => now(),
                     'customer_subscription_order_id' => $res['customer_busi_order_id'],
                  ]);

               if ($updated) {
                  AppLogger::api()->info('Survey order updated after data subscription', [
                     'survey_order_id' => $surveyOrderId,
                     'customer_subscription_order_id' => $res['customer_busi_order_id'],
                     'service_number' => $serviceNo,
                     'service_type' => 'data',
                  ]);
               } else {
                  AppLogger::api()->warning('Failed to update survey order after data subscription', [
                     'survey_order_id' => $surveyOrderId,
                     'customer_subscription_order_id' => $res['customer_busi_order_id'],
                     'service_type' => 'data',
                  ]);
               }

               // Update payment table with customer_subscription_order_id (important for manual subscriptions)
               try {
                  DB::table('payments')
                     ->where('customer_survey_order_id', $surveyOrderId)
                     ->update(['customer_subscription_order_id' => $res['customer_busi_order_id']]);

                  AppLogger::api()->info('Payment updated with customer_subscription_order_id after data subscription', [
                     'survey_order_id' => $surveyOrderId,
                     'customer_subscription_order_id' => $res['customer_busi_order_id'],
                     'service_type' => 'data',
                  ]);
               } catch (\Throwable $e) {
                  AppLogger::api()->warning('Failed to update payment with customer_subscription_order_id', [
                     'survey_order_id' => $surveyOrderId,
                     'customer_subscription_order_id' => $res['customer_busi_order_id'],
                     'error' => $e->getMessage(),
                     'service_type' => 'data',
                  ]);
                  // Don't fail - subscription was successful
               }
            } catch (\Throwable $e) {
               AppLogger::api()->exception($e, 'Exception updating survey order after data subscription', [
                  'survey_order_id' => $surveyOrderId,
                  'customer_subscription_order_id' => $res['customer_busi_order_id'],
                  'service_type' => 'data',
               ]);
               // Don't fail the entire request - subscription was successful
            }

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
                  AppLogger::api()->info('Data subscription SMS sent successfully', [
                     'phone' => substr($phone, -4), // Last 4 digits only
                     'survey_order_id' => $surveyOrderId,
                     'service_type' => 'data',
                  ]);
               } catch (\RuntimeException $e) {
                  AppLogger::api()->warning('Data subscription SMS blocked or rate-limited', [
                     'phone' => substr($phone, -4), // Last 4 digits only
                     'reason' => $e->getMessage(),
                     'survey_order_id' => $surveyOrderId,
                     'service_type' => 'data',
                  ]);
               } catch (\Throwable $e) {
                  AppLogger::api()->exception($e, 'Data subscription SMS failed unexpectedly', [
                     'phone' => substr($phone, -4), // Last 4 digits only
                     'survey_order_id' => $surveyOrderId,
                     'service_type' => 'data',
                  ]);
               }
            }
         } else {
            // Log Huawei error response
            AppLogger::api()->warning('Data subscription request failed', [
               'ret_code' => $res['ret_code'],
               'ret_msg' => $res['ret_msg'],
               'survey_order_id' => $surveyOrderId,
               'service_type' => 'data',
            ]);
         }

      } catch (\Throwable $e) {
         AppLogger::api()->exception($e, 'Unexpected error parsing data subscription response', [
            'survey_order_id' => $surveyOrderId,
            'service_type' => 'data',
         ]);
      }


      return $res;
   }
}
