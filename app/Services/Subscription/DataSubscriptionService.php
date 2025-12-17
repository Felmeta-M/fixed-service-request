<?php

namespace App\Services\Subscription;

use App\Models\SurveyRequest;
use App\Enums\FFDServiceProvisionStatus;
use App\Models\Customer;
use App\Services\ApiResponse;
use Illuminate\Support\Facades\Log;

class DataSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
    protected function offeringId(): int
    {
        return 1457567289; // DATA
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
        $xml = $this->buildXml($data);
        $response = $this->executeRequest($xml);
        Log::info($response);
        return $this->parseResponse($data, $response);
    }

    protected function buildXml(array $data): string
    {
        $cfg = config('services.subscriber');
        $cfg['default_password'] = "REDACTED_PASSWORD";

        $email = $this->generateEmail();

        $customer = Customer::current();

        //TODO: to be replaced by frontend data
        $data['region'] = $customer->region ??  30;
        $data['city'] = $customer->city ?? 1;
        $data['zone'] = $customer->zone ?? 6;
        $data['wereda'] = $customer->wereda ?? 90;
        $data['kebele'] = $customer->kebele ?? $data['kebele'];
        $data['house_no'] = $customer->kebele ?? $data['house_no'];
        $data['sms_no'] = $customer->phone_number ?? $data['sms_no'];


        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services">
 <soapenv:Body>
  <ser:CreateNewSubscriberReqMsg>
   <ser:RequestHeader>
    <com:Version>1</com:Version>
    <com:TransactionId>{$this->transactionId()}</com:TransactionId>
    <com:ProcessTime>{$this->processTime()}</com:ProcessTime>
    <com:Language>2002</com:Language>
    <com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
    <com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
    <com:TenantId>{$cfg['tenant_id']}</com:TenantId>
    <com:AccessUser>{$cfg['access_user']}</com:AccessUser>
    <com:AccessPwd>{$cfg['access_pwd']}</com:AccessPwd>
    <com:OperatorId>{$cfg['operator_id']}</com:OperatorId>
   </ser:RequestHeader>

   <ser:CreateNewSubscriberReqBody>
    <com:CustomerBusiOrder>
     <com:CustomerSurveyOrderId>{$data['survey_order_id']}</com:CustomerSurveyOrderId>
     <com:CustomerCode>{$data['customer_code']}</com:CustomerCode>

     <com:AccountInfo>
      <com:PaymentType>1</com:PaymentType>
      <com:BillCycle>01</com:BillCycle>
      <com:ethioZoneOrRegion>{$data['region']}</com:ethioZoneOrRegion>
      <com:CollectionCenter>10163</com:CollectionCenter>
      <com:Language>2002</com:Language>
      <com:FirstName>{$data['first_name']}</com:FirstName>
      <com:MiddleOrFatherName>{$data['middle_name']}</com:MiddleOrFatherName>
      <com:LastName>{$data['last_name']}</com:LastName>
      <com:EnterpriseCustomerName>{$data['enterprise_name']}</com:EnterpriseCustomerName>
      <com:CreditClass>Excellent</com:CreditClass>
      <com:AdministrativeRegionCity>{$data['city']}</com:AdministrativeRegionCity>
      <com:SubcityZone>{$data['zone']}</com:SubcityZone>
      <com:WeredaTown>{$data['wereda']}</com:WeredaTown>
      <com:Kebele>{$data['kebele']}</com:Kebele>
      <com:HouseNo>{$data['house_no']}</com:HouseNo>
      <com:SMSNo>{$data['sms_no']}</com:SMSNo>
     <com:PaymentMode>
      <com:PaymentMode>CASH</com:PaymentMode>
      </com:PaymentMode>
      <com:ExtParamList>
            <com:ParameterInfo>
            <com:ParamName>paymentType</com:ParamName>
            <com:ParamValue>0</com:ParamValue>
            </com:ParameterInfo>
     </com:ExtParamList>
     </com:AccountInfo>
    </com:CustomerBusiOrder>

    <com:SubBusiOrderlist>
     <com:BusinessCode>{$this->businessCode()}</com:BusinessCode>
     <com:SubscriberInfo>
      <com:ExternalSequnce>{$this->transactionId()}</com:ExternalSequnce>
      <com:NetworkType>{$this->networkType()}</com:NetworkType>
      <com:SubType>1</com:SubType>
      <com:SubLanguage>2002</com:SubLanguage>

      <com:PrimaryOffering>
       <com:NewPrimaryOffering>
        <com:OfferingId>
         <com:OfferingId>{$this->offeringId()}</com:OfferingId>
        </com:OfferingId>
       </com:NewPrimaryOffering>
       <com:EffectiveMode>0</com:EffectiveMode>
      </com:PrimaryOffering>

      <com:InternetAccount>{$email}</com:InternetAccount>
      <com:InternetPassword>{$cfg['default_password']}</com:InternetPassword>
      <com:SLAPriority>6</com:SLAPriority>
      <com:CallCenterAccess>994</com:CallCenterAccess>
     </com:SubscriberInfo>
    </com:SubBusiOrderlist>
    
    <com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
    <com:InstallmentCompletedDate>{$data['completed_date']}</com:InstallmentCompletedDate>
   </ser:CreateNewSubscriberReqBody>
  </ser:CreateNewSubscriberReqMsg>
 </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(array $data, string $xml)
    {
        $parsed = simplexml_load_string($xml);
        $ns = $parsed->getNamespaces(true);

        $body = $parsed->children($ns['soapenv'])->Body;
        $rsp  = $body->children($ns['ser'])->CreateNewSubscriberRspMsg;
        $hdr  = $rsp->ResponseHeader->children($ns['com']);

        if ((string)$hdr->RetCode !== '0') {
            return ApiResponse::error((string)$hdr->RetMsg);
        }

        /** DATA returns FBBNUMBER */
        foreach ($rsp->ExtParamList->children($ns['com'])->ParameterInfo as $p) {
            if ((string)$p->ParamName === 'FBBNUMBER') {
                $serviceNo = (string)$p->ParamValue;

                SurveyRequest::where('customer_survey_order_id', $data['survey_order_id'])
                    ->update([
                        'service_number' => $serviceNo,
                        'status' => FFDServiceProvisionStatus::Subscribed->value,
                        'subscribed_at' => now(),
                    ]);

                return ApiResponse::success([
                    'service_number' => $serviceNo
                ]);
            }
        }

        return ApiResponse::error('Service number not returned');
    }
}
