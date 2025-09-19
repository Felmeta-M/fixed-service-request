<?php


namespace App\Services;


class AccountListService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.get_account_list.endpoint');
    }

    public function getAccountList(string $serviceNumber)
    {
        try {
            $xmlPayload = $this->buildXml($serviceNumber);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponse($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Account query failed.');
        }
    }


    protected function buildXml(string $serviceNumber): string
    {
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');
        $accessUser = config('services.get_account_list.user');
        $accessPwd = config('services.get_account_list.password');
        $channelId = config('services.get_account_list.channel_id');
        $techChannelId = config('services.get_account_list.tech_channel_id');
        $tenantId = config('services.get_account_list.tenant_id', 101);

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:GetAccountListRequest>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:ChannelId>{$channelId}</com:ChannelId>
            <com:TechnicalChannelId>{$techChannelId}</com:TechnicalChannelId>
            <com:TenantId>{$tenantId}</com:TenantId>
            <com:AccessUser>{$accessUser}</com:AccessUser>
            <com:AccessPwd>{$accessPwd}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:GetAccountListBody>
            <com:ServiceNumber>{$serviceNumber}</com:ServiceNumber>
         </ser:GetAccountListBody>
      </ser:GetAccountListRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response into a usable PHP array.
     */
    protected function parseResponse(string $xml)
    {  // Load XML
        $xmlObject = simplexml_load_string($xml);

        if ($xmlObject === false) {
            return ApiResponse::error("Invalid XML response for get account list");
        }

        // Register namespaces
        $namespaces = $xmlObject->getNamespaces(true);

        // Navigate to GetAccountListResponse
        $response = $xmlObject->children($namespaces['soapenv'])
            ->Body
            ->children($namespaces['ser'])
            ->GetAccountListResponse;

        // --- Parse ResponseHeader ---
        $responseHeader = $response->ResponseHeader->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;
        $responseTime = (string) $responseHeader->ResponseTime;

        if ($retCode !== '0') {
            return ApiResponse::error("Get account number API returned error: {$retMsg}");
        }

        // --- Parse Account List ---
        $body = $response->GetAccountBody;
        $accounts = [];

        foreach ($body->children($namespaces['com'])->GetAccountListInfo as $account) {
            $accountChildren = $account->children($namespaces['com']);

            $accounts[] = [
                'account_id'   => (string) $accountChildren->AccountId,
                'account_code' => (string) $accountChildren->AccountCode,
                'payment_type' => (string) $accountChildren
                    ->ExtParamList
                    ->ParameterInfo
                    ->ParamValue,
            ];
        }

        return ApiResponse::success([
            'ret_code'  => $retCode,
            'ret_msg'   => $retMsg,
            'timestamp' => $responseTime,
            'accounts'  => $accounts,
        ]);
    }
}
