<?php

namespace App\Services;

class QuerySurveyOrderSummery extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    public function querySurveyOrderSummary(array $data)
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse);
            return ApiResponse::success($parsedXml, 'Query survey by order summery successfully.');
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Query survey order summery failed.');
        }
    }

    protected function buildRequestXml($data): string
    {
        $transactionId = uniqid();
        $config = config('services.ng');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QuerySurveyOrderSummaryReqMsg>
         <ser:RequestHeader>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['technical_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:QuerySurveyOrderSummReqBody>
            <com:StartTime>{$data['start_time']}</com:StartTime>
            <com:EndTime>{$data['end_time']}</com:EndTime>
            <com:TotalRowNum>0</com:TotalRowNum>
            <com:BeginRowNum>{$data['begin_row_num']}</com:BeginRowNum>
            <com:FetchRowNum>{$data['fetch_row_num']}</com:FetchRowNum>
         </ser:QuerySurveyOrderSummReqBody>
      </ser:QuerySurveyOrderSummaryReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response
     */
    private function parseResponseXml(string $xml)
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);
        $body = $parsed->children($namespaces['soapenv'])->Body;
        $responseMsg = $body->children($namespaces['ser'])->QuerySurveyOrderSummaryRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody   = $responseMsg->QuerySurveyOrderSumRespBody->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error('Query survey order summery failed!');
        }

        $orders = [];
        if (isset($responseBody->CustomSurveyOrderList)) {
            foreach ($responseBody->CustomSurveyOrderList->children($namespaces['com']) as $order) {
                $orders[] = [
                    'CustomerSurveyOrderId' => (string) $order->CustomerSurveyOrderId,
                    'CustomerName' => (string) $order->CustomerName,
                    'CustomerCode' => (string) $order->CustomerCode,
                    'OrderType' => (string) $order->OrderType,
                    'CreationDate' => (string) $order->CreationDate,
                    'CompleteDate' => isset($order->CompleteDate) ? (string) $order->CompleteDate : null,
                    'OrderStatus' => (string) $order->OrderStatus,
                ];
            }
        }

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'total_row_num' => (string) $responseBody->TotalRowNum,
            'begin_row_num' => (string) $responseBody->BeginRowNum,
            'fetch_row_num' => (string) $responseBody->FetchRowNum,
            'orders' => $orders,
        ];
    }
}
