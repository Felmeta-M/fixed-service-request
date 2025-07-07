<?php


namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GetAccountListService
{
    /**
     * Send a GetAccountListRequest SOAP call.
     */
    public function getAccountList(string $serviceNumber): array
    {
        $xml = $this->buildXmlGetAccountList($serviceNumber);

        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xml, 'text/xml')->post(config('services.get_account_list.url'));

        if ($response->failed()) {
            Log::error('Get Account List SOAP request failed', [
                'xml' => $xml,
                'response' => $response->body(),
            ]);
            throw new \Exception('SOAP Request Failed');
        }

        return $this->parseAccountListResponse($response->body());
    }

    /**
     * Build SOAP XML for GetAccountListRequest.
     */
    protected function buildXmlGetAccountList(string $serviceNumber): string
    {
        $transactionId = now()->format('YmdHis') . rand(1000, 9999);
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
    protected function parseAccountListResponse(string $xml): array
    {
        $soap = simplexml_load_string($xml);
        $body = $soap->children('http://schemas.xmlsoap.org/soap/envelope/')->Body;

        $response = $body->children('http://oss.huawei.com/webservice/bss/services')->GetAccountListResponse;
        $responseHeader = $response->ResponseHeader->children('http://www.huawei.com/bss/soaif/interface/common/');
        $retCode = (string) $responseHeader->RetCode;

        if ($retCode !== '0') {
            throw new \Exception('Huawei API returned error code: ' . $retCode);
        }

        $accounts = [];
        foreach ($response->GetAccountBody->GetAccountListInfo ?? [] as $account) {
            $accountId = (string) $account->AccountId;
            $accountCode = (string) $account->AccountCode;

            // Extract ExtParams
            $params = [];
            foreach ($account->ExtParamList->ParameterInfo ?? [] as $param) {
                $params[(string) $param->ParamName] = (string) $param->ParamValue;
            }

            $accounts[] = [
                'AccountId' => $accountId,
                'AccountCode' => $accountCode,
                'ExtParams' => $params,
            ];
        }

        return [
            'count' => count($accounts),
            'accounts' => $accounts,
        ];
    }
}
