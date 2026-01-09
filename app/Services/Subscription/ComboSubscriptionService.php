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
        $data = $this->normalize($payload);

        $xml = $this->buildXml($data);

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
    private function buildXml(array $d): string
    {
        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
<soapenv:Header/>
<soapenv:Body>
<ser:CreateNewSubscriberReqMsg>

<ser:RequestHeader>
 <com:Version>{$d['header']['version']}</com:Version>
 <com:TransactionId>{$d['header']['transaction_id']}</com:TransactionId>
 <com:SessionId>{$d['header']['session_id']}</com:SessionId>
 <com:ProcessTime>{$d['header']['process_time']}</com:ProcessTime>
 <com:ContactId>{$d['header']['contact_id']}</com:ContactId>
 <com:Language>{$d['header']['language']}</com:Language>
 <com:ChannelId>{$d['header']['channel_id']}</com:ChannelId>
 <com:TechnicalChannelId>{$d['header']['technical_channel_id']}</com:TechnicalChannelId>
 <com:TenantId>{$d['header']['tenant_id']}</com:TenantId>
 <com:AccessUser>{$d['header']['access_user']}</com:AccessUser>
 <com:AccessPwd>{$d['header']['access_pwd']}</com:AccessPwd>
 <com:AccessIP>{$d['header']['access_ip']}</com:AccessIP>
 <com:TestFlag>{$d['header']['test_flag']}</com:TestFlag>
</ser:RequestHeader>

<ser:CreateNewSubscriberReqBody>

<com:CustomerBusiOrder>
 <com:CustomerSurveyOrderId>{$d['survey_order_id']}</com:CustomerSurveyOrderId>
 <com:CustomerCode>{$d['customer']['code']}</com:CustomerCode>
 <com:IsCombo>1</com:IsCombo>
</com:CustomerBusiOrder>

<com:SubBusiOrderlist>
 <com:BusinessCode>CO015</com:BusinessCode>
 <com:GroupSubInfo>
   <com:ExternalSequnce>{$d['meta']['external_seq']}</com:ExternalSequnce>
   <com:PrimaryOffering>
     <com:NewPrimaryOffering>
       <com:OfferingId>
         <com:OfferingId>{$d['combo']['group_offering_id']}</com:OfferingId>
       </com:OfferingId>
     </com:NewPrimaryOffering>
     <com:EffectiveMode>0</com:EffectiveMode>
     <com:InstanceProperty>
       <com:PropertyCode>50135</com:PropertyCode>
       <com:PropertyType>1</com:PropertyType>
       <com:Value>{$d['combo']['cpe_type']}</com:Value>
     </com:InstanceProperty>
     <com:InstanceProperty>
       <com:PropertyCode>50134</com:PropertyCode>
       <com:PropertyType>1</com:PropertyType>
       <com:Value>{$d['combo']['cpe_serial']}</com:Value>
     </com:InstanceProperty>
   </com:PrimaryOffering>
 </com:GroupSubInfo>
</com:SubBusiOrderlist>

<com:SubBusiOrderlist>
 <com:BusinessCode>CO015</com:BusinessCode>
 <com:SubscriberInfo>
   <com:SubType>1</com:SubType>
   <com:ServiceNumber>{$d['service_number']}</com:ServiceNumber>
   <com:NetworkType>4</com:NetworkType>
   <com:PrimaryOffering>
     <com:NewPrimaryOffering>
       <com:OfferingId>
         <com:OfferingId>{$d['combo']['voice_offering_id']}</com:OfferingId>
       </com:OfferingId>
     </com:NewPrimaryOffering>
   </com:PrimaryOffering>
 </com:SubscriberInfo>
</com:SubBusiOrderlist>

<com:SubBusiOrderlist>
 <com:BusinessCode>CO015</com:BusinessCode>
 <com:SubscriberInfo>
   <com:SubType>0</com:SubType>
   <com:PrimaryOffering>
     <com:NewPrimaryOffering>
       <com:OfferingId>
         <com:OfferingId>{$d['combo']['data_offering_id']}</com:OfferingId>
       </com:OfferingId>
     </com:NewPrimaryOffering>
   </com:PrimaryOffering>
   <com:InternetAccount>{$d['internet']['account']}</com:InternetAccount>
   <com:InternetPassword>{$d['internet']['password']}</com:InternetPassword>
 </com:SubscriberInfo>
</com:SubBusiOrderlist>

<com:ExternalOperid>{$d['operator']['id']}</com:ExternalOperid>
<com:ExternalOperName>{$d['operator']['name']}</com:ExternalOperName>
<com:InstallmentCompletedDate>{$d['meta']['install_date']}</com:InstallmentCompletedDate>

</ser:CreateNewSubscriberReqBody>
</ser:CreateNewSubscriberReqMsg>
</soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Namespace-safe response parsing
     */
    private function parseResponse(string $xml): array
    {
        $res = [
            'success' => false,
            'ret_code' => null,
            'ret_msg' => null,
            'customer_busi_order_id' => null,
            'extra_params' => [],
        ];

        $obj = simplexml_load_string($xml);
        if (!$obj) return $res;

        $body = $obj->children('soapenv', true)->Body;
        $rsp  = $body->children('ser', true)->CreateNewSubscriberRspMsg;

        $header = $rsp->children('ser', true)
            ->ResponseHeader->children('com', true);

        $res['ret_code'] = (string) $header->RetCode;
        $res['ret_msg']  = (string) $header->RetMsg;
        $res['success']  = ((string) $header->RetCode === '0');

        $res['customer_busi_order_id'] =
            (string) $rsp->CustomerBusiOrderId;

        if (isset($rsp->ExtParamList)) {
            foreach ($rsp->ExtParamList->children('com', true)->ParameterInfo as $p) {
                $res['extra_params'][(string)$p->ParamName]
                    = (string)$p->ParamValue;
            }
        }

        return $res;
    }
}
