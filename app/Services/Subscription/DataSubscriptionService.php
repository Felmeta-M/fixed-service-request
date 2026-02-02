<?php

namespace App\Services\Subscription;

use App\Models\SurveyOrder;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\ApiResponse;
use App\Services\GetCombiningService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\QuerySubscriptionOrderStatusService;
use App\Services\ReserveNumberService;
use App\Services\ZoneService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Enums\OfferId;

class DataSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
   public function __construct(
      protected readonly GetCombiningService $get_combining_service,
      PaymentService $payment_service,
      QueryAvailableNumberService $queryAvailableNumberService,
      ReserveNumberService $reserveNumberService,
      ZoneService $zoneService,
   ) {
      parent::__construct($payment_service, $queryAvailableNumberService, $reserveNumberService, $zoneService);
   }

   protected function mainOfferingId(): int
   {
      return OfferId::FixedData->value; // FBB OR DATA
   }

   protected function fbbOfferingId(): int
   {
      return OfferId::FixedData->value;
   }

   protected function voiceOfferingId(): int
   {
      return OfferId::FixedVoice->value;
   }

   protected function comboOfferingId(): int
   {
      return OfferId::FixedCombo->value;
   }

   protected function businessCode(): string
   {
      return 'CO015';
   }

   protected function networkType(): int
   {
      return 3; // matches actual XML
   }

   // Store internet credentials for use in parseResponse
   protected ?string $internetAccount = null;
   protected ?string $internetPassword = null;

   public function create(array $data)
   {
      // Check if survey order is already subscribed (prevent duplicate subscriptions)
      $duplicateCheck = $this->checkDuplicateSubscription($data['survey_order_id']);
      if ($duplicateCheck !== null) {
         return $duplicateCheck;
      }

      $surveyOrder = SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'])->first();

      // Use shared helper to hydrate customer data
      $data = $this->hydrateWithCustomerData($data);

      // Add with_device flag, device_id, and device_offer_id from survey order for conditional XML generation
      $data['with_device'] = $surveyOrder->with_device ?? false;
      $data['device_id'] = $surveyOrder->device_id ?? null;
      $data['device_offer_id'] = $surveyOrder->device_offer_id ?? null;

      $xml = $this->buildXml($data);

      // Add internet credentials to data for parseResponse
      $data['internet_account'] = $this->internetAccount;
      $data['internet_password'] = $this->internetPassword;

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
      $cfg = config('services.ng');

      // Get dynamic customer profile, address, and BSS classification from logged-in user
      $data['customer_code'] = $this->customerCode($data['customer_code'] ?? null);
      $profile = $this->getCustomerProfile();
      $address = $this->getCustomerAddress();
      $bss = $this->getBssClassification();

      // Generate unique email/username using customer name
      // Sanitize customer name: lowercase, remove spaces and special characters
      // Note: InternetAccount is limited to 20 chars max (ICCID field limit in BSS)
      // Using @ethio.et (9 chars) gives us 11 chars for username
      $customerName = $profile['name'] ?? 'customer';
      $sanitizedName = preg_replace('/[^a-z0-9]/', '', strtolower($customerName));

      // Use first 8 chars of name for personalization, then 3 random chars for uniqueness
      $namePart = substr($sanitizedName, 0, 8); // Up to 8 chars from name
      $randomSuffix = strtolower(Str::random(3)); // 3 random chars for uniqueness
      $username = substr($namePart . $randomSuffix, 0, 11); // Max 11 chars tota 


      $customerEthioZone = $this->getZoneCodeForCustomerAddress($data);
      $accountEthioZone = $this->getZoneCodeForAccountInfo($data['survey_order_id'], $data);

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
         'internet_account' => $username,
         'internet_password' => 'REDACTED_PASSWORD=',
         'call_center_access' => '994',
         'external_oper_id' => '512',
         'installment_date' => $this->completedDate(),
      ]);

      $email = $this->generateEmail();


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
                  <com:ethioZoneOrRegion>{$accountEthioZone}</com:ethioZoneOrRegion>
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
                           <com:OfferingId>{$this->mainOfferingId()}</com:OfferingId>
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
                  <com:InternetAccount>{$username}</com:InternetAccount>
                  <com:InternetPassword>REDACTED_PASSWORD=</com:InternetPassword>
                  <com:CallCenterAccess>994</com:CallCenterAccess>
               </com:SubscriberInfo>
            </com:SubBusiOrderlist>

             <!-- one off fee resource -->
             {$this->oneOffFeeCalculation($data)}

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

      // Get device offer_id: first from survey order, then fallback to fetching from available_devices
      $deviceOfferId = $data['device_offer_id'] ?? null;

      // Fallback: fetch offer_id from available_devices using device_id
      if (empty($deviceOfferId) && !empty($data['device_id'])) {
         $device = \App\Models\AvailableDevice::find($data['device_id']);
         $deviceOfferId = $device?->offer_id;
      }

      // If still no offer_id, skip device offering (no valid offer_id available)
      if (empty($deviceOfferId)) {
         return '';
      }

      return <<<XML
                  <com:SupplementaryOfferingList>
                     <com:OfferingInstance>
                        <com:OfferingId>
                           <com:OfferingId>{$deviceOfferId}</com:OfferingId>
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

   protected function oneOffFeeCalculation(array $data)
   {
      $device = \App\Models\AvailableDevice::find($data['device_id']);
      if (empty($device)) {
         return '';
      }

      $oneOffFee = $this->calculateOneOffFee((float) $device->price, (float) $device->discount);
      $originalFee = $oneOffFee['original_fee'];
      $taxFee = $oneOffFee['tax_fee']; // in birr
      $calculatedFee = $oneOffFee['calculated_fee']; // in birr
      $itemCode = $device->item_code;
      $itemName = $device->item_name ?? 'Device purchase';
      $feeType = 'One-Off Change';
      $currencyId = 1048; // ETB
      $payType = 1; // CASH
      $taxCode = 'CC_TAX_VAT'; // VAT
      $taxName = 'VAT'; // VAT
      $discountFee = $oneOffFee['discount_fee']; // in birr

      return <<<XML
<com:CalcOneOffFeeETC>
    <com:FeeItemCode>{$itemCode}</com:FeeItemCode>
    <com:FeeItemName>{$itemName}</com:FeeItemName>
    <com:FeeType>{$feeType}</com:FeeType>
    <com:CurrencyID>{$currencyId}</com:CurrencyID>
    <com:CaculatedFee>{$calculatedFee}</com:CaculatedFee>
    <com:OriginalFee>{$originalFee}</com:OriginalFee>
    <com:DiscountFee>{$discountFee}</com:DiscountFee>
    <com:TaxInfo>
        <com:TaxCode>{$taxCode}</com:TaxCode>
        <com:TaxName>{$taxName}</com:TaxName>
        <com:TaxFee>{$taxFee}</com:TaxFee>
        <com:TaxRate>0.15</com:TaxRate>
    </com:TaxInfo>
    <com:PayType>{$payType}</com:PayType>
</com:CalcOneOffFeeETC>
XML;
   }

   protected function calculateOneOffFee(
      float $price,
      float $discount = 0.0, // in percentage
      float $taxRate = 0.15,
      int $precision = 4
   ): array {
      $taxFee = round($price * $taxRate, $precision); // in birr
      $discountFee = round($price * $discount, $precision); // in birr
      $calculatedFee = round($price + $taxFee - $discountFee, $precision); // in birr

      return [
         'original_fee' => round($price, $precision), // in birr
         'tax_rate' => $taxRate,
         'tax_fee' => $taxFee, // in birr
         'calculated_fee' => $calculatedFee,
         'discount_fee' => $discountFee,
      ];
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

            // Update SurveyOrder with service number and internet credentials
            $internetAccount = $data['internet_account'] ?? null;
            $internetPassword = $data['internet_password'] ?? null;

            $this->updateSurveyOrderWithSubscriptionData(
               $surveyOrderId,
               $res['customer_busi_order_id'],
               [
                  'service_number' => $serviceNo,
                  'internet_account' => $internetAccount,
                  'internet_password' => $internetPassword,
               ],
               'data'
            );

            // Update payment table with customer_subscription_order_id (important for manual subscriptions)
            $this->updatePaymentWithSubscriptionOrderId(
               $surveyOrderId,
               $res['customer_busi_order_id'],
               'data'
            );

            // Send SMS notifications (non-blocking)
            if (!empty($data['sms_no'])) {
               try {
                  // Send subscription activation notification
                  \App\Services\NotificationService::sendSubscriptionActivated(
                     $data['sms_no'],
                     'data',
                     $serviceNo
                  );

                  // Send internet credentials (separate SMS for clarity)
                  if ($internetAccount && $internetPassword) {
                     \App\Services\NotificationService::sendInternetCredentials(
                        $data['sms_no'],
                        $serviceNo,
                        $internetAccount,
                        $internetPassword
                     );
                  }
               } catch (\Throwable $e) {
                  AppLogger::api()->warning('Failed to send data subscription SMS', [
                     'survey_order_id' => $surveyOrderId,
                     'error' => $e->getMessage(),
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
