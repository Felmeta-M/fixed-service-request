<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyRequest;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class SurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function createSurveyOrder(array $data): JsonResponse
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            logger('xml response: ' . $xmlResponse);
            $parsedXml = $this->parseResponseXml($data, $xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            return ApiResponse::exception($e, 'Create survey order failed.');
        }
    }

    private function buildRequestXml(array $data): string
    {
        // Use existing config values
        $credentials = config('services.survey');

        // Dynamic values
        $transactionId = uniqid();
        $processTime = date('YmdHis');
        $sessionId = $credentials['session_id'] ?? uniqid();
        $contactNo = substr($data['contact_no'], -9);
        $bandwidth = $data['bandwidth'] ? $this->parseBandwidth($data['bandwidth']) : "";
        $completedDate = date('YmdHis');

        $data['main_offer_id'] = 1457567289;// voice 1207609454; //
        $data['sec_contact_person'] = "";
        $data['sec_contact_no'] = "";
        $data['sec_contact_email'] = "";
        $data['external_operid'] = "";
        $data['external_oper_name'] = "";

        $extParameters = [
            'NEID' => '700041565830',
            'CABLETYPE' => '3',
            'NUMBER_LINE' => '1',
            'LONGITUDE' => '38.733694',
            'LATITUDE' => '9.007778',
            'GIS_FLAG' => 'True',
            'NEW_PARAM' => 'NewValue'
        ];

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:HandleSurveyOrderReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:SessionId>{$sessionId}</com:SessionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>{$credentials['language']}</com:Language>
            <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
            <com:TenantId>{$credentials['tenant_id']}</com:TenantId>
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
               <com:HouseNo>90</com:HouseNo>
               <com:SupplementAddress>{$data['survey_address_info']['address']}</com:SupplementAddress>
            </com:SurveyAddressInfo>
            <com:bandwidth>{$bandwidth}</com:bandwidth>
            <com:ContactPerson>{$data['contact_person']}</com:ContactPerson>
            <com:ContactNo>{$contactNo}</com:ContactNo>
            <com:ContactEmail>{$data['contact_email']}</com:ContactEmail>
            <com:CompletedDate>{$completedDate}</com:CompletedDate>
            <com:SecContactPerson>{$data['sec_contact_person']}</com:SecContactPerson>
            <com:SecContactNo>{$data['sec_contact_no']}</com:SecContactNo>
            <com:SecContactEmail>{$data['sec_contact_email']}</com:SecContactEmail>
            <com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
            <com:ExternalOperName>{$data['external_oper_name']}</com:ExternalOperName>
           <com:ExtParamList>
               <com:ParameterInfo>
                  <com:ParamName>NEID</com:ParamName>
                  <com:ParamValue>{$extParameters['NEID']}</com:ParamValue>
               </com:ParameterInfo>
               <com:ParameterInfo>
                  <com:ParamName>CABLETYPE</com:ParamName>
                  <com:ParamValue>{$extParameters['CABLETYPE']}</com:ParamValue>
               </com:ParameterInfo>
               <com:ParameterInfo>
                  <com:ParamName>NUMBER_LINE</com:ParamName>
                  <com:ParamValue>{$extParameters['NUMBER_LINE']}</com:ParamValue>
               </com:ParameterInfo>
               <com:ParameterInfo>
                  <com:ParamName>LONGITUDE</com:ParamName>
                  <com:ParamValue>{$extParameters['LONGITUDE']}</com:ParamValue>
               </com:ParameterInfo>
               <com:ParameterInfo>
                  <com:ParamName>LATITUDE</com:ParamName>
                  <com:ParamValue>{$extParameters['LATITUDE']}</com:ParamValue>
               </com:ParameterInfo>
               <com:ParameterInfo>
                  <com:ParamName>GIS_FLAG</com:ParamName>
                  <com:ParamValue>{$extParameters['GIS_FLAG']}</com:ParamValue>
               </com:ParameterInfo>
               <com:ParameterInfo>
                  <com:ParamName>NEW_PARAM</com:ParamName>
                  <com:ParamValue>{$extParameters['NEW_PARAM']}</com:ParamValue>
               </com:ParameterInfo>
            </com:ExtParamList>
         </ser:HandleSurveyOrderReqBody>
      </ser:HandleSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

//    private function buildRequestXml(array $data): string
//    {
//        $credentials = config('services.survey');
//        $transactionId = uniqid();
//        $contactNo = substr($data['contact_no'], -9);
//        $bandwidth = $this->parseBandwidth($data['bandwidth']);
//        if (!$bandwidth) {
//            throw new InvalidArgumentException('Bandwidth cannot be empty');
//        }
//
//        return <<<XML
//<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
//   <soapenv:Header/>
//   <soapenv:Body>
//      <ser:HandleSurveyOrderReqMsg>
//         <ser:RequestHeader>
//            <com:Version>1</com:Version>
//            <com:TransactionId>{$transactionId}</com:TransactionId>
//            <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
//            <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
//            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
//            <com:AccessPwd>{$credentials['access_password']}</com:AccessPwd>
//         </ser:RequestHeader>
//         <ser:HandleSurveyOrderReqBody>
//            <com:CustomerCode>{$data['customer_code']}</com:CustomerCode>
//            <com:SurveyType>{$data['survey_type']}</com:SurveyType>
//            <com:TelecomRegion>{$data['telecom_region']}</com:TelecomRegion>
//            <com:OperType>{$data['oper_type']}</com:OperType>
//            <com:MainOfferId>{$data['main_offer_id']}</com:MainOfferId>
//            <com:SurveyAddressInfo>
//               <com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
//               <com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
//               <com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
//               <com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
//            </com:SurveyAddressInfo>
//            <com:bandwidth>{$bandwidth}</com:bandwidth>
//            <com:ContactPerson>{$data['contact_person']}</com:ContactPerson>
//            <com:ContactNo>{$contactNo}</com:ContactNo>
//            <com:ContactEmail>{$data['contact_email']}</com:ContactEmail>
//            <com:CompletedDate>{$data['completed_date']}</com:CompletedDate>
//            <com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
//         </ser:HandleSurveyOrderReqBody>
//      </ser:HandleSurveyOrderReqMsg>
//   </soapenv:Body>
//</soapenv:Envelope>
//XML;
//    }

    protected function parseBandwidth(string|int $value): int
    {
        $value = strtolower(trim($value));

        if (preg_match('/^(\d+)m$/', $value, $matches)) {
            return (int)$matches[1] * 1024;
        }

        if (preg_match('/^(\d+)gbps$/', $value, $matches)) {
            return (int)$matches[1] * 1024 * 1024;
        }

        return $value;
    }

    private function parseResponseXml($data, string $xml)
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);

        $body = $parsed->children($namespaces['soapenv'])->Body;

        $responseMsg = $body->children($namespaces['ser'])->HandleSurveyOrderRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody = $responseMsg->HandleSurveyOrderRespBody->children($namespaces['com']);
        $retCode = (string)$responseHeader->RetCode;
        $retMsg = (string)$responseHeader->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error('Unable to create survey order');
        }

        $customerSurveyOrderId = (string)$responseBody->CustomerSurveyOrderId;

        SurveyRequest::create([
            ...$data,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => FFDServiceProvisionStatus::Completed->value
        ]);

        return ApiResponse::success([
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string)$responseHeader->ResponseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
        ]);
    }

    public function find($customerSurveyOrderId)
    {
        return SurveyRequest::query()->where('customer_survey_order_id', $customerSurveyOrderId)->first();
    }

    protected function endpoint(): string
    {
        return config('services.survey.endpoint');
    }
}
