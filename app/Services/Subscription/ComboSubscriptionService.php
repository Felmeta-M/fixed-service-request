<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\EcafService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\ReserveNumberService;
use App\Services\ZoneService;
use App\Support\CustomerContext;
use Illuminate\Support\Str;
use App\Enums\OfferId;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ComboSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   public function __construct(
      QueryAvailableNumberService $queryAvailableNumberService,
      ReserveNumberService $reserveNumberService,
      PaymentService $payment_service,
      ZoneService $zoneService,
      EcafService $ecafService,
   ) {
      parent::__construct($payment_service, $queryAvailableNumberService, $reserveNumberService, $zoneService, $ecafService);
   }

   protected function mainOfferingId(): int
   {
      return OfferId::FixedCombo->value;
   }

   protected function fbbOfferingId(): string
   {
      return OfferId::FixedData->value;
   }

   protected function voiceOfferingId(): string
   {
      return OfferId::FixedVoice->value;
   }

   /** Secondary offering ID for combo voice SubBusiOrderlist (BSS sub-offering). */
   protected function voiceRetailOfferingId(): string
   {
      return '507426219';
   }

   protected function comboOfferingId(): string
   {
      return OfferId::FixedCombo->value;
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
      $surveyOrder = SurveyOrder::where('customer_survey_order_id', $payload['survey_order_id'] ?? '')->first();
      if ($surveyOrder) {
         $payload['with_device'] = $surveyOrder->with_device ?? false;
         $payload['device_id'] = $surveyOrder->device_id ?? null;
         $payload['device_offer_id'] = $surveyOrder->device_offer_id ?? null;
         $payload['device_voice_id'] = $surveyOrder->device_voice_id ?? null;
         $payload['device_voice_offer_id'] = $surveyOrder->device_voice_offer_id ?? null;
      }

      // Generate transaction ID once for the entire request (used in XML and stored in DB)
      $payload['transaction_id'] = $this->generateTransactionId();

      try {
         // Build XML and get the voice service number and internet credentials
         $xmlData = $this->buildXmlWithServiceNumber($payload);
         $xml = $xmlData['xml'];
         $voiceServiceNumber = $xmlData['voice_service_number'];
      } catch (\RuntimeException $e) {
         $errorMessage = $e->getMessage();
         $isRateLimitError = str_contains($errorMessage, 'Rate limit');

         AppLogger::api()->error($isRateLimitError ? 'Subscription failed due to rate limit' : 'Failed to build XML', [
            'survey_order_id' => $payload['survey_order_id'] ?? null,
            'error' => $errorMessage,
         ]);

         return [
            'success' => false,
            'ret_code' => $isRateLimitError ? 'RATE_LIMIT_ERROR' : 'VALIDATION_ERROR',
            'ret_msg' => $errorMessage,
            'customer_busi_order_id' => null,
            'extra_params' => [],
         ];
      }

      // Add voice service number and internet credentials to payload for use in parseResponse
      $payload['voice_service_number'] = $voiceServiceNumber;
      $payload['internet_account'] = $xmlData['internet_account'];
      $payload['internet_password'] = $xmlData['internet_password'];

      $response = $this->executeRequest($xml);

      $parsedResponse = $this->parseResponse($response, $payload);

      return $parsedResponse;
   }

   /**
    * Build XML with service number.
    * Returns both XML and the voice service number for combo services.
    *
    * @param array $data
    * @return array ['xml' => string, 'voice_service_number' => string]
    */
   protected function buildXmlWithServiceNumber(array $data): array
   {
      // Get config values
      $cfg = config('services.ng');

      $zoneName = $this->getZoneNameForAccountInfo($data['survey_order_id'], $data);
      Log::info($zoneName);
      $depIds = DB::table('number_pools')->where('zone', $zoneName)->pluck('dept_id');

      if ($depIds->isEmpty()) {
         throw new \RuntimeException("No department configured for zone: {$zoneName}. Please add zone to number pool.");
      }

      $voiceServiceNumber = null;

      foreach ($depIds as $depId) {
         $numberList = $this->queryAvailableNumberService->queryAvailableNumbers([
            'pay_mode' => '1',
            'tele_type' => '4',
            'need_query_by_dept' => false,
            'res_cnt' => 10,
            'dept_id' => (string) $depId,
         ]);

         if (empty($numberList)) {
            continue;
         }

         // Try Level 6 first (preferred), then fall back to any available number
         $filtered = array_filter($numberList, fn($item) => $item['Level'] === '6');
         if (!empty($filtered)) {
            $voiceServiceNumber = reset($filtered)['ServiceNumber'];
            break;
         }

         // Fall back to any available number (including Level 0)
         $voiceServiceNumber = reset($numberList)['ServiceNumber'];
         break;
      }

      if ($voiceServiceNumber === null) {
         throw new \RuntimeException('No voice service number found in any department pool for zone: ' . $zoneName);
      }


      $data['customer_code'] = $this->customerCode($data['customer_code'] ?? null);

      // Get dynamic customer profile and address data
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $nameParts = CustomerContext::nameParts();

      // Generate unique email/username using customer name
      // Sanitize customer name: lowercase, remove spaces and special characters
      // Note: InternetAccount is limited to 20 chars max (ICCID field limit in BSS)
      // Using @ethio.et (9 chars) gives us 11 chars for username
      $customerName = $profile['name'] ?? 'customer';
      $sanitizedName = preg_replace('/[^a-z0-9]/', '', strtolower($customerName));

      // Use first 8 chars of name for personalization, then 3 random chars for uniqueness
      $namePart = substr($sanitizedName, 0, 8); // Up to 8 chars from name
      $randomSuffix = strtolower(Str::random(3)); // 3 random chars for uniqueness
      $username = substr($namePart . $randomSuffix, 0, 11); // Max 11 chars total

      $customerEthioZone = $this->getZoneCodeForCustomerAddress($data);
      $accountEthioZone = $this->getZoneCodeForAccountInfo($data['survey_order_id'], $data);

      $data['completed_date'] = $this->completedDate();
      $email = $this->generateEmail();

      $xml = <<<XML
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:CreateNewSubscriberReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$data['transaction_id']}</com:TransactionId>
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
                     <com:EthioZoneOrRegion>{$customerEthioZone}</com:EthioZoneOrRegion>
                     <com:AdministrativeRegionOrCity>{$address['region']}</com:AdministrativeRegionOrCity>
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
                  <com:ethioZoneOrRegion>{$accountEthioZone}</com:ethioZoneOrRegion>
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
               <com:BusinessCode>{$this->businessCode()}</com:BusinessCode>
               <!--You have a CHOICE of the next 2 items at this level-->
               <com:GroupSubInfo>
                  <com:ExternalSequnce>?</com:ExternalSequnce>

                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$this->mainOfferingId()}</com:OfferingId>
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
               <com:BusinessCode>{$this->businessCode()}</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:ServiceNumber>{$voiceServiceNumber}</com:ServiceNumber>
                  <com:NetworkType>4</com:NetworkType>
                  <com:SubType>1</com:SubType>

                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$this->voiceOfferingId()}</com:OfferingId>
                           <com:OfferingId>{$this->voiceRetailOfferingId()}</com:OfferingId>
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

                  {$this->buildSupplementaryOfferingList($this->voiceDeviceData($data))}

                  <com:SLAPriority>0</com:SLAPriority>
                  <com:CallCenterAccess>980,894</com:CallCenterAccess>
                  <com:SubLanguage>2002</com:SubLanguage>
                  <com:IVRLanguage>2060</com:IVRLanguage>
                  <com:GreenFlag>1</com:GreenFlag>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>

            <!-- one off fee resource (voice device for combo) -->
            {$this->oneOffFeeCalculation($this->voiceDeviceData($data))}

            <com:SubBusiOrderlist>
               <com:BusinessCode>{$this->businessCode()}</com:BusinessCode>
               <com:SubscriberInfo>
                  <com:SubType>0</com:SubType>
                  <com:SubLanguage>{$profile['primary_language']}</com:SubLanguage>

                  <com:PrimaryOffering>
                     <com:NewPrimaryOffering>
                        <com:OfferingId>
                           <com:OfferingId>{$this->fbbOfferingId()}</com:OfferingId>
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

                  {$this->buildSupplementaryOfferingList($this->dataDeviceData($data))}

                  <com:SLAPriority>0</com:SLAPriority>
                  <com:InternetAccount>{$username}</com:InternetAccount>
                  <com:InternetPassword>REDACTED_PASSWORD=</com:InternetPassword>
                  <com:CallCenterAccess>980,894</com:CallCenterAccess>
                  <com:SubLanguage>2002</com:SubLanguage>
                  <com:IVRLanguage>2060</com:IVRLanguage>
                  <com:GreenFlag>1</com:GreenFlag>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>

            <!-- one off fee resource (data device for combo) -->
            {$this->oneOffFeeCalculation($this->dataDeviceData($data))}

            <com:ExternalOperid>9527</com:ExternalOperid>
            <com:ExternalOperName>helloworld</com:ExternalOperName>
            <com:InstallmentCompletedDate>{$data['completed_date']}</com:InstallmentCompletedDate>
         </ser:CreateNewSubscriberReqBody>
      </ser:CreateNewSubscriberReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;

      return [
         'xml' => $xml,
         'voice_service_number' => $voiceServiceNumber,
         'internet_account' => $username,
         'internet_password' => 'REDACTED_PASSWORD=',
      ];
   }

   /**
    * Builds data array for voice device (SupplementaryOfferingList and oneOffFeeCalculation).
    * Combo uses device_voice_id and device_voice_offer_id for the voice SubBusiOrderlist.
    *
    * @param array $data Full payload with device_voice_id, device_voice_offer_id
    * @return array With with_device, device_id, device_offer_id keyed for base class methods
    */
   protected function voiceDeviceData(array $data): array
   {
      $deviceVoiceId = $data['device_voice_id'] ?? null;
      return [
         'with_device' => !empty($deviceVoiceId),
         'device_id' => $deviceVoiceId,
         'device_offer_id' => $data['device_voice_offer_id'] ?? null,
      ];
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

      // Response header - ResponseHeader is in 'ser' namespace, its children are in 'com' namespace
      $responseHeader = $rsp->children($namespaces['ser'])->ResponseHeader ?? null;
      if (!$responseHeader) {
         AppLogger::api()->warning('ComboSubscriptionService: ResponseHeader not found in response');
         return $res;
      }

      $header = $responseHeader->children($namespaces['com']);
      $res['ret_code'] = (string) $header->RetCode;
      $res['ret_msg'] = (string) $header->RetMsg;
      $res['success'] = ($res['ret_code'] === '0');

      // Customer order ID - CustomerBusiOrderId is in 'ser' namespace
      $res['customer_busi_order_id'] =
         (string) $rsp->children($namespaces['ser'])->CustomerBusiOrderId;

      AppLogger::api()->debug('ComboSubscriptionService parsed response', [
         'ret_code' => $res['ret_code'],
         'ret_msg' => $res['ret_msg'],
         'success' => $res['success'],
         'customer_busi_order_id' => $res['customer_busi_order_id'],
      ]);

      // Extra parameters - ExtParamList is in 'ser' namespace
      $extParamList = $rsp->children($namespaces['ser'])->ExtParamList ?? null;
      if ($extParamList) {
         $paramInfoList = $extParamList->children($namespaces['com'])->ParameterInfo;
         AppLogger::api()->debug('ExtParamList found', [
            'param_count' => count($paramInfoList),
         ]);

         foreach ($paramInfoList as $p) {
            $pChildren = $p->children($namespaces['com']);
            $paramName = (string) $pChildren->ParamName;
            $paramValue = (string) $pChildren->ParamValue;
            $res['extra_params'][$paramName] = $paramValue;

            // Log FBB/Data number extraction for combo services
            if ($paramName === 'FBBNUMBER') {
               AppLogger::api()->info('Data service number extracted from BSS response', [
                  'data_service_number' => $paramValue,
               ]);
            }
         }
      } else {
         AppLogger::api()->debug('No ExtParamList in response');
      }

      /**
       * ✅ POST-SUCCESS BUSINESS LOGIC
       * Update survey order when subscription is successful
       * 
       * For Combo services:
       * - voice_service_number: Voice service number (we provided)
       * - data_service_number: Data/FBB service number (BSS returns in FBBNUMBER)
       */
      if ($res['success'] && !empty($res['customer_busi_order_id'])) {
         try {
            $surveyOrderId = $data['survey_order_id'] ?? null;
            $voiceServiceNumber = $data['voice_service_number'] ?? null;
            $fbbServiceNumber = $res['extra_params']['FBBNUMBER'] ?? null;
            $internetAccount = $data['internet_account'] ?? null;
            $internetPassword = $data['internet_password'] ?? null;

            if ($surveyOrderId) {
               // Update survey order with service numbers and internet credentials
               $updateData = [];

               // Transaction ID for tracking
               if (!empty($data['transaction_id'])) {
                  $updateData['transaction_id'] = $data['transaction_id'];
               }

               // Voice service number (we provide for combo)
               if ($voiceServiceNumber) {
                  $updateData['voice_service_number'] = $voiceServiceNumber;
               }

               // FBB/Data service number (BSS returns for combo)
               if ($fbbServiceNumber) {
                  $updateData['data_service_number'] = $fbbServiceNumber;
               }

               // Internet credentials for device configuration
               if ($internetAccount) {
                  $updateData['internet_account'] = $internetAccount;
               }
               if ($internetPassword) {
                  $updateData['internet_password'] = $internetPassword;
               }

               $this->updateSurveyOrderWithSubscriptionData(
                  $surveyOrderId,
                  $res['customer_busi_order_id'],
                  $updateData,
                  'combo'
               );

               // Update payment table
               $this->updatePaymentWithSubscriptionOrderId(
                  $surveyOrderId,
                  $res['customer_busi_order_id'],
                  'combo'
               );

               // Send SMS notifications (non-blocking)
               $smsNo = $data['sms_no'] ?? \App\Support\CustomerContext::phone();
               if (!empty($smsNo)) {
                  try {
                     // Send subscription activation notification
                     \App\Services\NotificationService::sendSubscriptionActivated(
                        $smsNo,
                        'combo',
                        $voiceServiceNumber
                     );

                     // Send internet credentials (separate SMS for clarity)
                     if ($internetAccount && $internetPassword) {
                        \App\Services\NotificationService::sendInternetCredentials(
                           $smsNo,
                           $fbbServiceNumber,
                           $internetAccount,
                           $internetPassword
                        );
                     }
                  } catch (\Throwable $e) {
                     AppLogger::api()->warning('Failed to send combo subscription SMS', [
                        'survey_order_id' => $surveyOrderId,
                        'error' => $e->getMessage(),
                     ]);
                  }
               }

               // ECAF upload moved to SurveyOrderController - triggered when status becomes Completed
            }
         } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Failed to update survey order after combo subscription', [
               'customer_busi_order_id' => $res['customer_busi_order_id'],
               'survey_order_id' => $data['survey_order_id'] ?? null,
            ]);
            // Don't fail the entire request - subscription was successful
         }
      }

      return $res;
   }
}
