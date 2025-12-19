<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyRequest;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class VoiceSurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function __construct() {}

    public function createSurveyOrder(array $data, array $resourceCheck = []): JsonResponse
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $parsedXml = $this->parseResponseXml($data, $xmlResponse, $resourceCheck);

            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            return ApiResponse::exception($e, 'Create Fixed Voice survey order failed.');
        }
    }

    private function buildRequestXml(array $data): string
    {
        $credentials = config('services.survey');

        $transactionId = date('YmdHis');
        $processTime = date('YmdHis');
        $sessionId = $credentials['session_id'] ?? uniqid();
        $contactNo = substr($data['contact_no'], -9);
        $completedDate = date('YmdHis');

        $data['main_offer_id'] = 1207609454; //voice test main offer id

        // Optional fields
        $secContactPerson = $data['sec_contact_person'] ?? null;
        $secContactNo = $data['sec_contact_no'] ?? null;
        $secContactEmail = $data['sec_contact_email'] ?? null;
        $externalOperid = $data['external_operid'] ?? null;
        $houseNo = $data['survey_address_info']['house_no'] ?? '';

        $extParameters = [
            'NEID' => '700041565830',
            'CABLETYPE' => '3',
            'NUMBER_LINE' => '1',
            'LONGITUDE' => $data['survey_address_info']['longitude'],
            'LATITUDE' => $data['survey_address_info']['latitude'],
            'GIS_FLAG' => 'True',
        ];

        $houseNo = $data['survey_address_info']['house_no'] ?? '';

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
            <com:MainOfferId>1207609454</com:MainOfferId>
            <com:SurveyAddressInfo>
               <com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
               <com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
               <com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
               <com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
               <com:HouseNo>{$houseNo}</com:HouseNo>
               <com:SupplementAddress>{$data['survey_address_info']['address']}</com:SupplementAddress>
            </com:SurveyAddressInfo>
            <com:bandwidth>{$data['bandwidth']}</com:bandwidth>
            <com:ContactPerson>{$data['contact_person']}</com:ContactPerson>
            <com:ContactNo>{$contactNo}</com:ContactNo>
            <com:ContactEmail>{$data['contact_email']}</com:ContactEmail>
            <com:CompletedDate>{$completedDate}</com:CompletedDate>
            <com:SecContactPerson>{$secContactPerson}</com:SecContactPerson>
            <com:SecContactNo>{$secContactNo}</com:SecContactNo>
            <com:SecContactEmail>{$secContactEmail}</com:SecContactEmail>
            <com:ExternalOperid>{$externalOperid}</com:ExternalOperid>
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
            </com:ExtParamList>
         </ser:HandleSurveyOrderReqBody>
      </ser:HandleSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(array $data, string $xml, array $resourceCheck = [])
    {
        // Load the XML and handle errors
        libxml_use_internal_errors(true);
        $parsed = simplexml_load_string($xml);
        if ($parsed === false) {
            throw new RuntimeException('Invalid XML response from survey service');
        }

        $namespaces = $parsed->getNamespaces(true);

        // Navigate to SOAP body
        $body = $parsed->children($namespaces['soapenv'] ?? 'soapenv')->Body ?? null;
        if (!$body) {
            throw new RuntimeException('Missing SOAP Body in response');
        }

        // Navigate to service response message
        $responseMsg = $body->children($namespaces['ser'] ?? 'ser')->HandleSurveyOrderRspMsg ?? null;
        if (!$responseMsg) {
            throw new RuntimeException('Missing HandleSurveyOrderRspMsg in response');
        }

        // Extract response header
        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com'] ?? 'com');
        $retCode = (string)($responseHeader->RetCode ?? '');
        $retMsg = (string)($responseHeader->RetMsg ?? '');
        $responseTime = (string)($responseHeader->ResponseTime ?? '');

        if ($retCode !== '0') {
            return ApiResponse::error("Survey service returned error: {$retMsg}");
        }

        // Extract response body
        $responseBody = $responseMsg->HandleSurveyOrderRespBody->children($namespaces['com'] ?? 'com');
        $customerSurveyOrderId = (string)($responseBody->CustomerSurveyOrderId ?? '');

        if (!$customerSurveyOrderId) {
            throw new RuntimeException('CustomerSurveyOrderId missing in survey response');
        }

        // Persist local record
        $this->createLocalSurveyOrder($customerSurveyOrderId, $data, $resourceCheck);

        return [
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => $responseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
        ];
    }


    protected function createLocalSurveyOrder(string $customerSurveyOrderId, array $data, array $resourceCheck = [])
    {
        SurveyRequest::create([
            ...$data,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => FFDServiceProvisionStatus::Completed->value,
            'cable_length' => $resourceCheck['distance'] ?? null,
            'cable_type'   => $resourceCheck['cable_type'] ?? null,
            'lat'          => $resourceCheck['latitude'] ?? null,
            'long'         => $resourceCheck['longitude'] ?? null,
        ]);
    }

    protected function endpoint(): string
    {
        return config('services.survey.endpoint');
    }
}
