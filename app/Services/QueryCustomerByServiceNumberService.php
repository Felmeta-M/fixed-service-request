<?php

namespace App\Services;

class QueryCustomerByServiceNumberService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.query_customer_by_service_number.endpoint');
    }

    public function getCustomer(string $serviceNumber)
    {
        try {
            $xmlPayload = $this->buildRequestXml($serviceNumber);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Query customer by service number failed.');
        }
    }

    protected function buildRequestXml(string $serviceNumber): string
    {
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');
        $config = config('services.query_customer_by_service_number');

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
            <com:Language>{$config['language']}</com:Language>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['technical_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:GetCustomerBody>
            <com:ServiceNumber>{$serviceNumber}</com:ServiceNumber>
         </ser:GetCustomerBody>
      </ser:GetCustomerRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(string $xml)
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
            return ApiResponse::error($retMsg);
        }

        $result = [
            'success'   => true,
            'ret_code'  => $retCode,
            'ret_msg'   => $retMsg,
            'customer'  => [
                'id'               => (string) $body->CustomerId,
                'code'             => (string) $body->CustomerCode,
                'first_name'       => (string) $body->FirstName,
                'middle_name'      => (string) $body->MiddleName,
                'last_name'        => (string) $body->LastName,
                'dob'              => (string) $body->DateOfBirth,
                'gender'           => (string) $body->Gender,
                'status'           => (string) $body->Status,
                'title'            => (string) $body->Title,
                'nationality'      => (string) $body->Nationality,
                'type'             => (string) $body->CustomerType,
                'level'            => (string) $body->CustomerLevel,
                'language'         => (string) $body->CustomerLanguage,
                'certificate_type' => (string) $body->CertificateType,
                'certificate_no'   => (string) $body->CertificateNumber,
                'tenant_id'        => (string) $body->TenantId,
                'occupation'       => (string) $body->Occupation,
                'religion'         => (string) $body->Religion,
                'education'        => (string) $body->Education,
            ],
            'contacts'    => [],
            'addresses'   => [],
            'subscribers' => [],
            'ext_params'  => [],
        ];

        foreach ($body->ContactList->ContactInfo ?? [] as $contact) {
            $result['contacts'][] = [
                'name1'  => (string) $contact->Relaname1,
                'name2'  => (string) $contact->Relaname2,
                'mobile' => (string) $contact->Relatel1,
                'fax'    => (string) $contact->Relafax,
            ];
        }

        foreach ($body->AddressList->AddressInfo ?? [] as $address) {
            $result['addresses'][] = [
                'address1' => (string) $address->Address1,
                'address2' => (string) $address->Address2,
                'address3' => (string) $address->Address3,
                'address4' => (string) $address->Address4,
                'address5' => (string) $address->Address5,
                'address6' => (string) $address->Address6,
            ];
        }

        foreach ($body->SubscriberList->SubscriberAbstractInfo ?? [] as $subscriber) {
            $result['subscribers'][] = [
                'subscriber_id'     => (string) $subscriber->SubscriberId,
                'service_number'    => (string) $subscriber->ServiceNumber,
                'payment_type'      => (string) $subscriber->PaymentType,
                'default_account_id' => (string) $subscriber->DefaultAccountId,
                'status'            => (string) $subscriber->Status,
            ];
        }

        foreach ($body->ExtParamList->ParameterInfo ?? [] as $param) {
            $result['ext_params'][(string) $param->ParamName] = (string) $param->ParamValue;
        }

        return $result;
    }
}
