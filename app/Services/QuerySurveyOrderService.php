<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QuerySurveyOrderService
{

    public function querySurveyOrderDetail(string $surveyOrderId)
    {
        try {
            $xml = $this->buildRequestXml($surveyOrderId);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->send('POST', config('services.query_survey.endpoint'), [
                'body' => $xml
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey order create request Failed'
                ], 500);
            }

            if ($response->successful()) {
                return $this->parseXmlResponse($response->body());
            }
        } catch (RequestException $e) {
            Log::error('RequestException', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to communicate with third-party service'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Unexpected Exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexcepted error occurred'
            ]);
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


    private function parseXmlResponse(string $xml): array
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);

        // Navigate into SOAP Body
        $body = $parsed->children($namespaces['soapenv'])->Body;

        // Your response tag is QuerySurveyOrderDetailRspMsg (not HandleSurveyOrderRspMsg)
        $responseMsg = $body->children($namespaces['ser'])->QuerySurveyOrderDetailRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody   = $responseMsg->QuerySurveyOrderDetailRespBody->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;

        if ($retCode !== '0') {
            return [
                'success'   => false,
                'ret_code'  => $retCode,
                'ret_msg'   => $retMsg,
            ];
        }

        // Extract CustomerSurveyOrderId
        $customerSurveyOrderId = (string) $responseBody->CustomerSurveyOrderId;

        // Extract SubOrderList
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
