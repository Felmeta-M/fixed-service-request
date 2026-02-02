<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class GetCombiningService extends BaseApiService
{
    protected int $timeout = 30;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.get_combining.endpoint');
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
     * 
     */
    protected function buildXml(string $serviceNumber): string
    {
        // Remove leading 0 prefix if present (e.g., 0935117912 -> 935117912)
        $serviceNumber = ltrim($serviceNumber, '0');
        $config = config('services.get_combining');

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

        // Access GetCombiningBody with proper namespace context
        $combiningBody = $response->children($namespaces['quer'])->GetCombiningBody;
        $body = $combiningBody->children($namespaces['quer']);

        // Extract customer type and level with explicit logging for debugging
        $customerType = (string) $body->CustomerType;
        $customerLevel = (string) $body->CustomerLevel;

        // Log parsed values for debugging
        Log::debug('GetCombiningService Parsed Values', [
            'customer_type' => $customerType,
            'customer_level' => $customerLevel,
            'customer_type_empty' => empty($customerType),
            'customer_level_empty' => empty($customerLevel),
            'first_name' => (string) $body->FirstName,
        ]);

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
                'middle_name' => (string) $body->MiddleName,
                'last_name' => (string) $body->LastName,
                'nationality' => (string) $body->Nationality,
                'customer_type' => $customerType,
                'customer_level' => $customerLevel,
                'customer_language' => (string) $body->CustomerLanguage,
                'gender' => (string) $body->Gender,
                'status' => (string) $body->Status,
            ],

            'account' => [
                'account_id' => (string) $body->AccountId,
                'account_code' => (string) $body->AccountCode,
            ],

            'addresses' => $this->parseAddresses($combiningBody, $namespaces),

            'ext_params' => $this->parseExtParams($combiningBody, $namespaces),

            'payment' => [
                'pay_type' => (string) $body->PayType,
                'sla_priority' => (string) $body->SLAPriority,
                'tele_type' => (string) $body->TeleType,
            ],
        ];
    }

    protected function parseAddresses($combiningBody, array $namespaces): array
    {
        $addresses = [];

        // Access AddressInfoList through quer namespace, then AddressInfo through bas namespace
        $bodyChildren = $combiningBody->children($namespaces['quer']);
        $addressInfoList = $bodyChildren->AddressInfoList;
        
        if ($addressInfoList) {
            foreach ($addressInfoList->children($namespaces['bas'])->AddressInfo ?? [] as $addr) {
                $addrChildren = $addr->children($namespaces['bas']);
                $addresses[] = [
                    'address_class' => (string) $addrChildren->AddressClass,
                    'contact_seq' => (string) $addrChildren->ContactSeq,
                    'address_type' => (string) $addrChildren->AddressType,
                    'local_id' => (string) $addrChildren->LocalId,
                    'address1' => (string) $addrChildren->Address1,
                    'address2' => (string) $addrChildren->Address2,
                    'address3' => (string) $addrChildren->Address3,
                    'address4' => (string) $addrChildren->Address4,
                    'address5' => (string) $addrChildren->Address5,
                    'address6' => (string) $addrChildren->Address6,
                    'address9' => (string) $addrChildren->Address9,
                    'address10' => (string) $addrChildren->Address10,
                    'address11' => (string) $addrChildren->Address11,
                    'address12' => (string) $addrChildren->Address12,
                ];
            }
        }

        return $addresses;
    }

    protected function parseExtParams($combiningBody, array $namespaces): array
    {
        $params = [];

        // Access ExtParamList through quer namespace, then ParameterInfo through bas namespace
        $bodyChildren = $combiningBody->children($namespaces['quer']);
        $extParamList = $bodyChildren->ExtParamList;
        
        if ($extParamList) {
            foreach ($extParamList->children($namespaces['bas'])->ParameterInfo ?? [] as $param) {
                $paramChildren = $param->children($namespaces['bas']);
                $params[(string) $paramChildren->ParamName] = (string) $paramChildren->ParamValue;
            }
        }

        return $params;
    }
}
