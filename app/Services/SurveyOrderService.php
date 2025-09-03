<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SurveyOrderService
{
    public function createSurveyOrder(array $data)
    {
        try {
            $xml = $this->buildXml($data);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->withBody($xml, 'text/xml')->post(config('services.survey.endpoint'));

            if ($response->failed()) {
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
        $credentials = config('services.survey');
        $transactionId = uniqid();
        $contactNo = substr($data['contact_no'], -9);

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
            <com:CustomerCode>{$data['customer_code']}</com:CustomerCode>
            <com:SurveyType>{$data['survey_type']}</com:SurveyType>
            <com:TelecomRegion>{$data['telecom_region']}</com:TelecomRegion>
            <com:OperType>{$data['oper_type']}</com:OperType>
            <com:MainOfferId>{$data['main_offer_id']}</com:MainOfferId>
            <com:SurveyAddressInfo>
               <com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
               <com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
               <com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
               <com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
            </com:SurveyAddressInfo>
            <com:bandwidth>{$data['bandwidth']}</com:bandwidth>
            <com:ContactPerson>{$data['contact_person']}</com:ContactPerson>
            <com:ContactNo>{$contactNo}</com:ContactNo>
            <com:ContactEmail>{$data['contact_email']}</com:ContactEmail>
            <com:CompletedDate>{$data['completed_date']}</com:CompletedDate>
            <com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
         </ser:HandleSurveyOrderReqBody>
      </ser:HandleSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    private function parseXmlResponse(string $xml): array
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);

        $body = $parsed->children($namespaces['soapenv'])->Body;

        $responseMsg = $body->children($namespaces['ser'])->HandleSurveyOrderRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody = $responseMsg->HandleSurveyOrderRespBody->children($namespaces['com']);
        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;
        if ($retCode !== '0') {
            return [
                'success'   => false,
                'ret_code'  => $retCode,
                'ret_msg'   => $retMsg,
            ];
        }
        return [
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'customer_survey_order_id' => (string) $responseBody->CustomerSurveyOrderId,
        ];
    }
}
