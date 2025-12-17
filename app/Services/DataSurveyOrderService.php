<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class DataSurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function __construct() {}

    public function createSurveyOrder(array $data, array $resourceCheck = []): JsonResponse
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            Log::info($xmlResponse);
            $parsedXml = $this->parseResponseXml($data, $xmlResponse, $resourceCheck);

            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            return ApiResponse::exception($e, 'Create survey order failed.');
        }
    }

    protected function buildRequestXml(array $data): string
    {
        $credentials = config('services.survey');

        $transactionId = date('YmdHis');
        $processTime = date('YmdHis');
        $sessionId = $credentials['session_id'] ?? uniqid();
        $contactNo = substr($data['contact_no'], -9);
        $bandwidth = $data['bandwidth'] ? $this->parseBandwidth($data['bandwidth']) : "";
        $completedDate = date('YmdHis');

        $data['main_offer_id'] = 1457567289; //voice test main offer id

        $extParameters = [
            'NEID' => '700041565830',
            'CABLETYPE' => '3',
            'LONGITUDE' => $data['survey_address_info']['longitude'],
            'LATITUDE' => $data['survey_address_info']['latitude'],
            'GIS_FLAG' => 'True',
        ];

        // Optional fields
        $secContactPerson = $data['sec_contact_person'] ?? null;
        $secContactNo = $data['sec_contact_no'] ?? null;
        $secContactEmail = $data['sec_contact_email'] ?? null;
        $externalOperid = $data['external_operid'] ?? null;
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
            <com:MainOfferId>{$data['main_offer_id']}</com:MainOfferId>
            <com:SurveyAddressInfo>
               <com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
               <com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
               <com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
               <com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
               <com:HouseNo>{$houseNo}</com:HouseNo>
               <com:SupplementAddress>{$data['survey_address_info']['address']}</com:SupplementAddress>
            </com:SurveyAddressInfo>
            <com:bandwidth>{$bandwidth}</com:bandwidth>
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

    protected function parseBandwidth(string|int $value): int
    {
        $value = strtolower(trim($value));

        if (preg_match('/^(\d+)m$/', $value, $matches)) {
            return (int)$matches[1] * 1024;
        }

        if (preg_match('/^(\d+)gbps$/', $value, $matches)) {
            return (int)$matches[1] * 1024 * 1024;
        }

        return (int)$value;
    }

    private function parseResponseXml(array $data, string $xml, array $resourceCheck = [])
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

        $this->createLocalSurveyOrder($customerSurveyOrderId, $data, $resourceCheck);

        return [
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string)$responseHeader->ResponseTime,
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

    public function find($customerSurveyOrderId)
    {
        return SurveyRequest::query()->where('customer_survey_order_id', $customerSurveyOrderId)->first();
    }

    protected function endpoint(): string
    {
        return config('services.survey.endpoint');
    }
}
