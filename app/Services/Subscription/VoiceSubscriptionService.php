<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use App\Services\QueryAvailableNumberService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\ReserveNumberService;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Support\Facades\DB;

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
      try {
         // Use shared helper to hydrate customer data
         $data = $this->hydrateWithCustomerData($data);

         $surveyOrderId = $data['survey_order_id'] ?? null;

         try {
            $xml = $this->buildXml($data);
         } catch (\RuntimeException $e) {
            // Return user-friendly error message for zone/area code lookup failures
            AppLogger::api()->error('Failed to build XML due to missing zone/area information', [
               'survey_order_id' => $surveyOrderId,
               'error' => $e->getMessage(),
            ]);

            return ApiResponse::error($e->getMessage());
         }

         $response = $this->executeRequest($xml);

         // AppLogger::api()->debug('Voice subscription API response received', [
         //    'survey_order_id' => $surveyOrderId,
         //    'response_preview' => substr($response, 0, 500),
         // ]);

         $parsedResponse = $this->parseResponse($data, $response);

         return $parsedResponse;
      } catch (\Throwable $e) {
         AppLogger::api()->exception($e, 'Voice subscription request failed unexpectedly', [
            'survey_order_id' => $data['survey_order_id'] ?? null,
            'service_type' => 'voice',
         ]);

         return ApiResponse::error('An unexpected error occurred during subscription. Please try again.');
      }
   }

   protected function buildXml(array $data): string
   {
      $cfg = config('services.subscriber');

      // Get dynamic customer profile, address, and BSS classification from logged-in user
      $data['customer_code'] = $this->customerCode($data['customer_code'] ?? null);
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $bss = $this->getBssClassification();

      // Get dynamic zone_code for CustomerAddressInfo EthioZoneOrRegion
      // This will throw an exception with a clear message if zone_code cannot be determined
      $customerEthioZone = $this->getCustomerZoneCode($data);

      // Get dynamic ethio_zone id for AccountInfo ethioZoneOrRegion
      // This will throw an exception with a clear message if ethio_zone id cannot be determined
      $accountEthioZone = $this->getAccountEthioZoneId($data['survey_order_id']);

      // Business defaults
      $data = array_merge($data, [
         'enterprise_name' => $profile['name'] ?? 'Customer',
         'credit_class' => $bss['credit_class'],
         'payment_mode' => 'CASH',
         'ext_payment_type' => '0',
         'business_code' => 'CO015',
         'external_sequence' => uniqid(),
         'network_type' => '4',
         'sub_type' => '1',
         'sub_language' => $profile['primary_language'],
         'offering_id' => '1207609454',
         'effective_mode' => '0',
         'sla_priority' => '6',
         'call_center_access' => '994',
         'external_oper_id' => '512',
         'installment_date' => $this->completedDate(),
      ]);

      $serviceNumber = SurveyOrder::query()
         ->where('customer_survey_order_id', $data['survey_order_id'])
         ->value('service_number');

      if (!$serviceNumber) {
         AppLogger::api()->error('Service number not found in survey order', [
            'survey_order_id' => $data['survey_order_id'] ?? null,
            'service_type' => 'voice',
         ]);
         throw new \RuntimeException('Service number not found in survey order');
      }

      // Store service number for later use
      $this->serviceNumber = $serviceNumber;

      // Unpick (release) the number from survey order reservation
      // The subscription API will automatically pick/reserve it when creating the subscription
      // When subscription is successful, the number is already attached/subscribed
      try {
         $released = $this->queryAvailableNumberService->releaseNumberService($serviceNumber);
         if (!$released) {
            AppLogger::api()->warning('Failed to release service number before subscription', [
               'service_number' => $serviceNumber,
               'survey_order_id' => $data['survey_order_id'] ?? null,
               'service_type' => 'voice',
            ]);
         }

         // AppLogger::api()->info('Service number released before subscription', [
         //    'service_number' => $serviceNumber,
         //    'survey_order_id' => $data['survey_order_id'] ?? null,
         //    'service_type' => 'voice',
         // ]);

      } catch (\Throwable $e) {
         AppLogger::api()->exception($e, 'Exception while releasing service number before subscription', [
            'service_number' => $serviceNumber,
            'survey_order_id' => $data['survey_order_id'] ?? null,
            'service_type' => 'voice',
         ]);
         // Continue anyway - the subscription API might still work
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
                     <com:EthioZoneOrRegion>{$customerEthioZone}</com:EthioZoneOrRegion>
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
                  <com:ethioZoneOrRegion>{$accountEthioZone}</com:ethioZoneOrRegion>
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
                  <com:SubLanguage>{$profile['primary_language']}</com:SubLanguage>

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
      try {
         libxml_use_internal_errors(true);
         $parsed = simplexml_load_string($xml);

         if ($parsed === false) {
            $errors = array_map(fn($e) => $e->message, libxml_get_errors());
            libxml_clear_errors();



            AppLogger::api()->error('Failed to parse voice subscription XML response', [
               'xml_preview' => substr($xml, 0, 500),
               'errors' => $errors,
               'survey_order_id' => $data['survey_order_id'] ?? null,
               'service_type' => 'voice',
            ]);

            return ApiResponse::error('Invalid response from subscription service. Please try again.');
         }

         $ns = $parsed->getNamespaces(true);
         $body = $parsed->children($ns['soapenv'])->Body ?? null;

         if (!$body) {
            $this->reReserveNumberIfNeeded($data);
            return ApiResponse::error('Invalid response structure from subscription service.');
         }

         $rsp = $body->children($ns['ser'])->CreateNewSubscriberRspMsg ?? null;

         if (!$rsp) {
            $this->reReserveNumberIfNeeded($data);
            return ApiResponse::error('Invalid response message from subscription service.');
         }

         $hdr = $rsp->ResponseHeader->children($ns['com']) ?? null;

         if (!$hdr) {
            $this->reReserveNumberIfNeeded($data);
            return ApiResponse::error('Invalid response header from subscription service.');
         }

         $retCode = (string) ($hdr->RetCode ?? '');
         $retMsg = (string) ($hdr->RetMsg ?? 'Unknown error');

         if ($retCode !== '0') {
            // Try to re-reserve the number if subscription failed
            $this->reReserveNumberIfNeeded($data);

            AppLogger::api()->warning('Voice subscription failed', [
               'ret_code' => $retCode,
               'ret_msg' => $retMsg,
               'survey_order_id' => $data['survey_order_id'] ?? null,
               'service_number' => $this->serviceNumber,
               'service_type' => 'voice',
            ]);

            return ApiResponse::error($retMsg);
         }

         $customerBusiOrderId = (string) ($rsp->CustomerBusiOrderId ?? '');

         if (empty($customerBusiOrderId)) {
            $this->reReserveNumberIfNeeded($data);
            return ApiResponse::error('Business order ID not found in response.');
         }

         // Update survey order status - subscription successful
         $this->persistSubscription(
            $data['survey_order_id'],
            $customerBusiOrderId,
            null, // Voice subscription doesn't update service_number here
            'voice'
         );

         // ✅ Send SMS to customer (non-blocking - failures are logged but don't affect response)
         if (!empty($data['sms_no']) && InteractsWithSMSGateway::ensurePhoneIsLocal($data['sms_no'])) {

            $phone = $data['sms_no'];
            $name = trim(explode(' ', $data['name'] ?? '')[0] ?? 'Customer');

            $message = sprintf(
               'Dear %s, thank you for choosing Ethio telecom. Your subscription has been successfully created. For support or to submit a TT/complaint, please visit https://fixedservices.ethiotelecom.et/services.',
               $name
            );

            try {
               InteractsWithSMSGateway::sendSmsOnly($phone, $message);
               AppLogger::api()->info('Subscription SMS sent successfully', [
                  'phone' => substr($phone, -4), // Last 4 digits only
                  'survey_order_id' => $data['survey_order_id'] ?? null,
                  'service_type' => 'voice',
               ]);
            } catch (\RuntimeException $e) {
               // Business-level failure (rate limit, gateway reject)
               AppLogger::api()->warning('Voice subscription SMS blocked or rejected', [
                  'phone' => substr($phone, -4), // Last 4 digits only
                  'reason' => $e->getMessage(),
                  'survey_order_id' => $data['survey_order_id'] ?? null,
                  'service_type' => 'voice',
               ]);
            } catch (\Throwable $e) {
               // System-level failure
               AppLogger::api()->exception($e, 'Voice subscription SMS failed unexpectedly', [
                  'phone' => substr($phone, -4), // Last 4 digits only
                  'survey_order_id' => $data['survey_order_id'] ?? null,
                  'service_type' => 'voice',
               ]);
            }
         }

         return ApiResponse::success([
            'customer_busi_order_id' => $customerBusiOrderId,
            'service_number' => $this->serviceNumber,
         ], 'Subscription created successfully');
      } catch (\Throwable $e) {
         // Try to re-reserve the number on any unexpected error
         $this->reReserveNumberIfNeeded($data);

         AppLogger::api()->exception($e, 'Unexpected error in voice subscription processing', [
            'survey_order_id' => $data['survey_order_id'] ?? null,
            'service_type' => 'voice',
         ]);

         return ApiResponse::error('An unexpected error occurred. Please try again.');
      }
   }

   /**
    * Attempt to re-reserve the service number if subscription failed.
    * This prevents the number from being lost if subscription fails after we released it.
    */
   protected function reReserveNumberIfNeeded(array $data): void
   {
      if (!$this->serviceNumber) {
         return;
      }

      try {
         // Try to re-reserve the number so it's not lost
         $reserved = $this->reserveNumberService->pick([
            'res_type_id' => 10,
            'oper_type' => 1029,
            'res_code' => $this->serviceNumber,
         ]);

         if ($reserved) {
            AppLogger::api()->info('Successfully re-reserved service number after voice subscription failure', [
               'service_number' => $this->serviceNumber,
               'survey_order_id' => $data['survey_order_id'] ?? null,
               'service_type' => 'voice',
            ]);

            // Update the survey order to keep the number
            try {
               SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'] ?? null)
                  ->update(['service_number' => $this->serviceNumber]);
            } catch (\Throwable $e) {
               AppLogger::api()->exception($e, 'Failed to update survey order with re-reserved number', [
                  'service_number' => $this->serviceNumber,
                  'survey_order_id' => $data['survey_order_id'] ?? null,
                  'service_type' => 'voice',
               ]);
            }
         } else {
            AppLogger::api()->warning('Failed to re-reserve service number after voice subscription failure', [
               'service_number' => $this->serviceNumber,
               'survey_order_id' => $data['survey_order_id'] ?? null,
               'service_type' => 'voice',
            ]);
         }
      } catch (\Throwable $e) {
         AppLogger::api()->exception($e, 'Exception while re-reserving service number after voice subscription failure', [
            'service_number' => $this->serviceNumber,
            'survey_order_id' => $data['survey_order_id'] ?? null,
            'service_type' => 'voice',
         ]);
      }
   }
}
