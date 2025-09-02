<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QuerySurveyOrderSummery
{

    public function querySurveyOrderSummary(array $data)
    {
        $xmlRequest = $this->buildRequest($data);

        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
            'SOAPAction' => '',
        ])->withBody($xmlRequest, 'text/xml')
            ->post(config('services.query_survey_summery.endpoint'));

        if (!$response->successful()) {
            return ['error' => 'Survey query summery SOAP request failed', 'status' => $response->status()];
        }

        if ($response->successful()) {
            return $this->parseResponseXml($response->body());
        }
    }

    protected function buildRequest($data): string
    {
        $transactionId = uniqid();
        $config = config('services.query_survey_summery');

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
    private function parseResponseXml(string $xml): array
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);

        // Navigate to Body -> QuerySurveyOrderSummaryRspMsg
        $body = $parsed->children($namespaces['soapenv'])->Body;
        $responseMsg = $body->children($namespaces['ser'])->QuerySurveyOrderSummaryRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody   = $responseMsg->QuerySurveyOrderSumRespBody->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;

        if ($retCode !== '0') {
            return [
                'success'   => false,
                'ret_code'  => $retCode,
                'ret_msg'   => $retMsg,
            ];
        }

        // Extract orders
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
