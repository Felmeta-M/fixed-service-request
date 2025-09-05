<?php

namespace App\Services;

use Illuminate\Http\JsonResponse;

class CancelSurveyOrderService extends BaseApiService
{
    protected int $timeout = 20;
    protected int $rateLimit = 15;

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
            return $this->parseResponse($xmlResponse);
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

    protected function parseResponse(string $xml): JsonResponse
    {
        $xmlObject  = simplexml_load_string($xml);

        if ($xmlObject === false) {
            return ApiResponse::error("Invalid XML response for cancel survey order");
        }

        // Get namespaces
        $namespaces = $xmlObject->getNamespaces(true);

        // Navigate to Body -> CancelSurveyOrderRspMsg
        $body = $xmlObject->children($namespaces['soapenv'])->Body;
        $response = $body->children($namespaces['ser'])->CancelSurveyOrderRspMsg;

        // Extract header values
        $header = $response->ResponseHeader->children($namespaces['com']);
        $retCode = (string) $header->RetCode;
        $retMsg  = (string) $header->RetMsg;
        $responseTime = (string) $header->ResponseTime;

        // Handle failure
        if ($retCode !== '0') {
            return ApiResponse::error($retMsg);
        }

        // Optionally extract body details
        $bodyData = $response->CancelSurveyOrderRequestBody ?? null;

        return ApiResponse::success([
            'ResponseTime' => $responseTime,
            'RetCode'      => $retCode,
            'RetMsg'       => $retMsg,
            'Body'         => $bodyData,
        ]);
    }
}
