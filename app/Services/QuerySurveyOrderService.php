<?php

namespace App\Services;


class QueryDataSurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.query_survey.endpoint');
    }

    public function querySurveyOrderDetail(string $surveyOrderId)
    {
        try {
            $xmlPayload = $this->buildRequestXml($surveyOrderId);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Query survey order failed.');
        }
    }

    /**
     * Build the SOAP XML request
     */
    protected function buildRequestXml(string $customerSurveyOrderId): string
    {
        $transactionId = uniqid();
        $config = config('services.query_survey');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QuerySurveyOrderDetailReqMsg>
         <ser:RequestHeader>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['technical_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:QuerySurveyOrderDetailReqBody>
            <com:CustomerSurveyOrderId>{$customerSurveyOrderId}</com:CustomerSurveyOrderId>
         </ser:QuerySurveyOrderDetailReqBody>
      </ser:QuerySurveyOrderDetailReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }


    private function parseResponseXml(string $xml)
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);

        $body = $parsed->children($namespaces['soapenv'])->Body;

        $responseMsg = $body->children($namespaces['ser'])->QuerySurveyOrderDetailRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody   = $responseMsg->QuerySurveyOrderDetailRespBody->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error('Query survey order failed!');
        }

        $customerSurveyOrderId = (string) $responseBody->CustomerSurveyOrderId;

        $subOrders = [];
        if (isset($responseBody->SubOrderList)) {
            foreach ($responseBody->SubOrderList->children($namespaces['com']) as $subOrder) {
                $subOrders[] = [
                    'SubSurveyOrderId' => (string) $subOrder->SubSurveyOrderId,
                    'OrderType' => (string) $subOrder->OrderType,
                    'OrderStatus' => (string) $subOrder->OrderStatus,
                    'PrimaryOfferid' => (string) $subOrder->PrimaryOfferid,
                    'TelecomRegion' => (string) $subOrder->TelecomRegion,
                    'ContactPerson' => (string) $subOrder->ContactPerson,
                    'ContactNo' => (string) $subOrder->ContactNo,
                    'ContactEmail' => (string) $subOrder->ContactEmail,
                ];
            }
        }

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'sub_orders' => $subOrders,
        ];
    }
}
