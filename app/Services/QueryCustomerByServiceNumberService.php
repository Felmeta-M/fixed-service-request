<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

namespace App\Services;

use Illuminate\Support\Facades\Http;

class QueryCustomerByServiceNumberService
{

    protected array $data;

    public function __construct()
    {
        $this->data = config('services.query_customer_by_service_number');
    }

    public function getCustomer(string $serviceNumber): array
    {
        $xmlRequest = $this->buildRequestXml($serviceNumber);
        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xmlRequest, 'text/xml')->post($this->data['customer_query_endpoint']);

        if (!$response->successful()) {
            return ['error' => 'Request failed', 'status' => $response->status()];
        }

        return $this->parseResponseXml($response->body());
    }

    protected function buildRequestXml(string $serviceNumber): string
    {
        $transactionId = now()->format('YmdHis') . rand(1000, 9999);
        $processTime = now()->format('YmdHis');
        $language = $this->data['language'];
        $channelId = $this->data['channel_id'];
        $techChannelId = $this->data['technical_channel_id'];
        $user = $this->data['access_user'];
        $pwd = $this->data['access_pwd'];

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:GetCustomerRequest>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>{$language}</com:Language>
            <com:ChannelId>{$channelId}</com:ChannelId>
            <com:TechnicalChannelId>{$techChannelId}</com:TechnicalChannelId>
            <com:AccessUser>{$user}</com:AccessUser>
            <com:AccessPwd>{$pwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:GetCustomerBody>
            <com:ServiceNumber>{$serviceNumber}</com:ServiceNumber>
         </ser:GetCustomerBody>
      </ser:GetCustomerRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(string $xml): array
    {
        $xmlObject  = simplexml_load_string($xml);
        $namespaces = $xmlObject->getNamespaces(true);

        $body = $xmlObject->children($namespaces['soapenv'])->Body;
        $response = $body->children($namespaces['ser'])->GetCustomerResponse;

        $header = $response->ResponseHeader->children($namespaces['com']);
        $body   = $response->GetCustomerBody->children($namespaces['com']);

        $retCode = (string) $header->RetCode;
        $retMsg  = (string) $header->RetMsg;

        if ($retCode !== '0') {
            return [
                'success' => false,
                'ret_code' => $retCode,
                'ret_msg'  => $retMsg,
            ];
        }

        $result = [
            'ret_code' => $retCode,
            'ret_msg'  => $retMsg,
            'customer' => [
                'id'          => (string) $body->CustomerId,
                'code'        => (string) $body->CustomerCode,
                'type'        => (string) $body->CustomerType,
                'certificate' => (string) $body->CertificateNumber,
                'status'      => (string) $body->Status,
            ],
            'subscribers' => [],
            'ext_params'  => [],
        ];

        foreach ($body->SubscriberList->SubscriberAbstractInfo as $subscriber) {
            $result['subscribers'][] = [
                'subscriber_id'     => (string) $subscriber->SubscriberId,
                'service_number'    => (string) $subscriber->ServiceNumber,
                'payment_type'      => (string) $subscriber->PaymentType,
                'default_account_id' => (string) $subscriber->DefaultAccountId,
                'status'            => (string) $subscriber->Status,
            ];
        }

        foreach ($body->ExtParamList->ParameterInfo as $param) {
            $result['ext_params'][(string) $param->ParamName] = (string) $param->ParamValue;
        }

        return $result;
    }
}
