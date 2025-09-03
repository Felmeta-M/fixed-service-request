<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QueryCustomerByCodeService
{
    public function getCustomer(string $customerCode)
    {
        $xml = $this->buildXml($customerCode);

        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xml, 'text/xml')->post(config('services.query_customer.url'));


        if ($response->failed()) {
            return [
                'success' => false,
                'message' => 'Failed to retrieve customer data using query customer by code.',
            ];
        }

        if ($response->successful()) {
            return $this->parseResponse($response->body());
        }
    }

    protected function buildXml(string $customerCode): string
    {
        $transactionId = now()->format('YmdHis') . rand(1000, 9999);
        $processTime = now()->format('YmdHis');
        $accessUser = config('services.query_customer.user');
        $accessPwd = config('services.query_customer.password');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:GetCustomerRequest>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>2002</com:Language>
            <com:ChannelId>61</com:ChannelId>
            <com:TechnicalChannelId>51</com:TechnicalChannelId>
            <com:AccessUser>{$accessUser}</com:AccessUser>
            <com:AccessPwd>{$accessPwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:GetCustomerBody>
            <com:CustomerCode>{$customerCode}</com:CustomerCode>
         </ser:GetCustomerBody>
      </ser:GetCustomerRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(string $xml): array
    {
        $xmlObject  = simplexml_load_string($xml);
        $namespaces = $xmlObject->getNamespaces(true);

        $body = $xmlObject->children($namespaces['soapenv'])->Body;
        $response = $body->children($namespaces['ser'])->GetCustomerResponse;

        $header = $response->ResponseHeader->children($namespaces['com']);
        $body   = $response->GetCustomerBody->children($namespaces['com']);
        $retCode = (string) $header->RetCode;
        $retMsg  = (string) $header->RetMsg;

        // Handle failure case
        if ($retCode !== '0') {
            return [
                'success'   => false,
                'ret_code'  => $retCode,
                'ret_msg'   => $retMsg,
            ];
        }

        $result = [
            'ret_code' => $retCode,
            'ret_msg'  => $retMsg,
            'customer' => [
                'id'          => (string) $body->CustomerId,
                'code'        => (string) $body->CustomerCode,
                'first_name'  => (string) $body->FirstName,
                'middle_name' => (string) $body->MiddleName,
                'last_name'  => (string) $body->LastName,
                'dob'        => (string) $body->DateOfBirth,
                'gender'     => (string) $body->Gender,
                'status'     => (string) $body->Status,
            ],
            'contacts'   => [],
            'addresses'  => [],
            'ext_params' => [],
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

        foreach ($body->ExtParamList->ParameterInfo ?? [] as $param) {
            $result['ext_params'][(string) $param->ParamName] = (string) $param->ParamValue;
        }

        return $result;
    }
}
