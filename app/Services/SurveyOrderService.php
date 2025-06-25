<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class SurveyOrderService
{
    public function createSurveyOrder(array $payload)
    {
        try {
            $xml = $this->buildXml($payload);

            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->send('POST', config('services.survey_order.endpoint'), [
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

    private function buildXml(array $data): string
    {
        $credentials = config('services.survey_order');
        $transactionId = uniqid();

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:HandleSurveyOrderReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
            <com:AccessPwd>{$credentials['access_password']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:HandleSurveyOrderReqBody>
            <com:CustomerCode>{$data['CustomerCode']}</com:CustomerCode>
            <com:SurveyType>{$data['SurveyType']}</com:SurveyType>
            <com:TelecomRegion>{$data['TelecomRegion']}</com:TelecomRegion>
            <com:OperType>{$data['OperType']}</com:OperType>
            <com:MainOfferId>{$data['MainOfferId']}</com:MainOfferId>
            <com:bandwidth>{$data['bandwidth']}</com:bandwidth>
            <com:ContactPerson>{$data['ContactPerson']}</com:ContactPerson>
            <com:ContactNo>{$data['ContactNo']}</com:ContactNo>
            <com:ContactEmail>{$data['ContactEmail']}</com:ContactEmail>
            <com:CompletedDate>{$data['CompletedDate']}</com:CompletedDate>
            <com:SecContactPerson>{$data['SecContactPerson']}</com:SecContactPerson>
            <com:SecContactNo>{$data['SecContactNo']}</com:SecContactNo>
            <com:SecContactEmail>{$data['SecContactEmail']}</com:SecContactEmail>
         </ser:HandleSurveyOrderReqBody>
      </ser:HandleSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    private function parseXmlResponse(string $xml): array
    {
        $parsed = simplexml_load_string($xml);
        $body = $parsed->children('soapenv', true)->Body;

        $responseMsg = $body->children('ser', true)->HandleSurveyOrderRspMsg;
        $header = $responseMsg->ResponseHeader->children('com', true);

        return [
            'ret_code' => (string) $header->RetCode,
            'ret_msg' => (string) $header->RetMsg,
            'response_time' => (string) $header->ResponseTime,
        ];
    }
}
