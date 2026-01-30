<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class GetCombiningService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    public function getByServiceNumber(string $serviceNumber)
    {
        try {
            $xmlRequest = $this->buildXml($serviceNumber);
            $xmlResponse = $this->executeRequest($xmlRequest);
            Log::info('GetCombiningService Response', ['xmlResponse' => $xmlResponse]);
            return ApiResponse::success(
                $this->parseResponse($xmlResponse)
            );
        } catch (\Throwable $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        }
    }

    /**
     * Build SOAP request
     */
    protected function buildXml(string $serviceNumber): string
    {
        $config = config('services.ng');

        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');

        return <<<XML
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:quer="http://crm.huawei.com/query/"
                  xmlns:bas="http://crm.huawei.com/basetype/">
   <soapenv:Header/>
   <soapenv:Body>
      <quer:GetCombiningRequest>
         <quer:RequestHeader>
            <bas:Version>1</bas:Version>
            <bas:TransactionId>{$transactionId}</bas:TransactionId>
            <bas:ProcessTime>{$processTime}</bas:ProcessTime>
            <bas:Language>2002</bas:Language>
            <bas:ChannelId>{$config['channel_id']}</bas:ChannelId>
            <bas:TechnicalChannelId>{$config['technical_channel_id']}</bas:TechnicalChannelId>
            <bas:TenantId>{$config['tenant_id']}</bas:TenantId>
            <bas:AccessUser>{$config['access_user']}</bas:AccessUser>
            <bas:AccessPwd>{$config['access_pwd']}</bas:AccessPwd>
         </quer:RequestHeader>
         <quer:GetCombiningBody>
            <quer:ServiceNumber>{$serviceNumber}</quer:ServiceNumber>
         </quer:GetCombiningBody>
      </quer:GetCombiningRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP response
     */
    protected function parseResponse(string $xml): array
    {
        $xmlObject = simplexml_load_string($xml);
        $namespaces = $xmlObject->getNamespaces(true);

        $body = $xmlObject->children($namespaces['soapenv'])->Body;
        $response = $body->children($namespaces['quer'])->GetCombiningResponse;

        $header = $response->ResponseHeader->children($namespaces['bas']);


        if ((string) $header->RetCode !== '0') {
            throw new \RuntimeException((string) $header->RetMsg);
        }

        $body = $response->GetCombiningBody;

        return [
            'subscriber' => [
                'subscriber_id' => (string) $body->SubscriberId,
                'service_number' => (string) $body->ServiceNumber,
                'subs_status' => (string) $body->SubsStatus,
            ],

            'customer' => [
                'customer_id' => (string) $body->CustomerId,
                'customer_code' => (string) $body->CustomerCode,
                'first_name' => (string) $body->FirstName,
                'nationality' => (string) $body->Nationality,
                'customer_type' => (string) $body->CustomerType,
                'customer_level' => (string) $body->CustomerLevel,
                'customer_language' => (string) $body->CustomerLanguage,
                'gender' => (string) $body->Gender,
                'status' => (string) $body->Status,
            ],

            'account' => [
                'account_id' => (string) $body->AccountId,
                'account_code' => (string) $body->AccountCode,
            ],

            'addresses' => $this->parseAddresses($body, $namespaces),

            'ext_params' => $this->parseExtParams($body, $namespaces),

            'payment' => [
                'pay_type' => (string) $body->PayType,
                'sla_priority' => (string) $body->SLAPriority,
                'tele_type' => (string) $body->TeleType,
            ],
        ];
    }

    protected function parseAddresses($body, array $namespaces): array
    {
        $addresses = [];

        foreach ($body->AddressInfoList->children($namespaces['bas'])->AddressInfo ?? [] as $addr) {
            $addresses[] = [
                'address_class' => (string) $addr->AddressClass,
                'contact_seq' => (string) $addr->ContactSeq,
                'address_type' => (string) $addr->AddressType,
                'local_id' => (string) $addr->LocalId,
                'address1' => (string) $addr->Address1,
                'address2' => (string) $addr->Address2,
                'address3' => (string) $addr->Address3,
                'address4' => (string) $addr->Address4,
                'address5' => (string) $addr->Address5,
                'address6' => (string) $addr->Address6,
                'address9' => (string) $addr->Address9,
                'address11' => (string) $addr->Address11,
            ];
        }

        return $addresses;
    }

    protected function parseExtParams($body, array $namespaces): array
    {
        $params = [];

        foreach ($body->ExtParamList->children($namespaces['bas'])->ParameterInfo ?? [] as $param) {
            $params[(string) $param->ParamName] = (string) $param->ParamValue;
        }

        return $params;
    }
}
