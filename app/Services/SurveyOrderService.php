<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyRequest;
use InvalidArgumentException;

class SurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.survey.endpoint');
    }

    public function createSurveyOrder(array $data)
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($data, $xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Create survey order failed.');
        }
    }

    private function buildRequestXml(array $data): string
    {
        $credentials = config('services.survey');
        $transactionId = uniqid();
        $contactNo = substr($data['contact_no'], -9);

        $bandwidth = $this->parseBandwidth($data['bandwidth']);
        if (!$bandwidth) {
            throw new \InvalidArgumentException('Bandwidth cannot be empty');
        }

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
            <com:bandwidth>{$bandwidth}</com:bandwidth>
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

    private function parseResponseXml($data, string $xml)
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
            return ApiResponse::error('Unable to create survey order');
        }

        $customerSurveyOrderId = (string) $responseBody->CustomerSurveyOrderId;

        SurveyRequest::create([
            ...$data,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => FFDServiceProvisionStatus::Waiting->value
        ]);

        return ApiResponse::success([
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'customer_survey_order_id' =>  $customerSurveyOrderId,
        ]);
    }

    protected function parseBandwidth(string $value): int
    {
        $value = strtolower(trim($value));

        if (preg_match('/^(\d+)m$/', $value, $matches)) {
            return (int) $matches[1];
        }

        if (preg_match('/^(\d+)gbps$/', $value, $matches)) {
            return (int) $matches[1] * 1024;
        }

        return 0;
    }
}
