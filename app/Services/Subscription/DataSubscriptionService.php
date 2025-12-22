<?php

namespace App\Services\Subscription;

use App\Models\SurveyRequest;
use App\Enums\FFDServiceProvisionStatus;
use App\Models\Customer;
use App\Services\ApiResponse;
use App\Services\GetCombiningService;
use Illuminate\Support\Facades\Log;

class DataSubscriptionService extends BaseSubscriptionService implements SubscriptionInterface
{
    public function __construct(protected readonly GetCombiningService $get_combining_service) {}

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
        Log::info($xml);
        $response = $this->executeRequest($xml);
        Log::info($response);
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
        $customer = Customer::current();
        $email = $this->generateEmail();

        $cfg = config('services.subscriber');
        $cfg['default_password'] = "REDACTED_PASSWORD";

        $data['customer_code'] = $customer->code;
        $data['completed_date'] = now()->addDays(30)->format('Y-m-d');
        $data['external_operid'] = uniqid();

        // $response = $this->get_combining_service->getByServiceNumber($data['access_number']);
        // $responseData = $response->getData(true);
        // $subscriber = $this->getSubscriber($responseData);
        // //TODO: to be replaced by frontend data
        // $data['region'] = $subscriber['addresses'][0]['address1'];
        // $data['city'] = $subscriber['addresses'][0]['address2'];
        // $data['zone'] = $subscriber['addresses'][0]['address3'];
        // $data['wereda'] = $subscriber['addresses'][0]['address4'];
        // $data['kebele'] = $subscriber['addresses'][0]['address5'];
        // $data['house_no'] = $subscriber['addresses'][0]['address6'];
        // $data['sms_no'] = "";

        //TODO: to be replaced by frontend data
        $data['region'] = 30;
        $data['city'] = 6;
        $data['zone'] = 6;
        $data['wereda'] = 90;
        $data['kebele'] =  'test';
        $data['house_no'] = 'test';
        $data['sms_no'] = '0986532147';

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

        $retCode = (string)$hdr->RetCode;
        $retMsg  = (string)$hdr->RetMsg;

        // Real failure cases only
        if ($retCode !== '0' && $retCode !== '-999') {
            return ApiResponse::error($retMsg);
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

                // $message = $retCode === '-999'
                //     ? 'Duplicate request – previous success reused'
                //     : 'Provisioned successfully';
                return ApiResponse::success([
                    'service_number' => $serviceNo
                ]);
            }
        }

        return ApiResponse::error('Service number not returned');
    }
}
