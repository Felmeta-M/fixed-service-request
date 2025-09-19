<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyRequest;
use Illuminate\Http\JsonResponse;

class CancelSurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 5;

    protected function endpoint(): string
    {
        return config('services.cancel_survey.endpoint');
    }

    public function cancelSurveyOrder(string $customerSurveyOrderId): JsonResponse
    {
        try {
            // Build XML
            $xmlPayload = $this->buildXml($customerSurveyOrderId);

            // Execute SOAP request
            $xmlResponse = $this->executeRequest($xmlPayload);

            // Parse XML response
            return $this->parseResponse($customerSurveyOrderId, $xmlResponse);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Cancel survey order failed.');
        }
    }

    protected function buildXml(string $customerSurveyOrderId): string
    {
        $transactionId = uniqid();
        $processTime   = now()->format('YmdHis');
        $config = config('services.cancel_survey');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:CancelSurveyOrderReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['tech_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$config['user']}</com:AccessUser>
            <com:AccessPwd>{$config['password']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:CancelSurveyOrderRequestBody>
            <com:CustomerSurveyOrderId>{$customerSurveyOrderId}</com:CustomerSurveyOrderId>
         </ser:CancelSurveyOrderRequestBody>
      </ser:CancelSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(string $customerSurveyOrderId, string $xml): JsonResponse
    {
        $xmlObject  = simplexml_load_string($xml);

        if ($xmlObject === false) {
            return ApiResponse::error("Invalid XML response for cancel survey order");
        }

        $namespaces = $xmlObject->getNamespaces(true);
        $body = $xmlObject->children($namespaces['soapenv'])->Body;
        $response = $body->children($namespaces['ser'])->CancelSurveyOrderRspMsg;

        $header = $response->ResponseHeader->children($namespaces['com']);
        $retCode = (string) $header->RetCode;
        $retMsg  = (string) $header->RetMsg;
        $responseTime = (string) $header->ResponseTime;

        if ($retCode !== '0') {
            return ApiResponse::error($retMsg);
        }

        SurveyRequest::where('customer_survey_order_id', $customerSurveyOrderId)
            ->first()?->update(['status' => FFDServiceProvisionStatus::Canceled->value]);

        $bodyData = $response->CancelSurveyOrderRequestBody ?? null;

        return ApiResponse::success([
            'ResponseTime' => $responseTime,
            'RetCode'      => $retCode,
            'RetMsg'       => $retMsg,
            'Body'         => $bodyData,
        ]);
    }
}
