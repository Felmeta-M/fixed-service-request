<?php

namespace App\Services\Survey;

use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class DataSurveyService extends BaseSurveyService implements SurveyInterface
{
    protected function mainOfferId(): int
    {
        return 1457567289;
    }

    protected function buildXml(array $data, array $resource): string
    {
        $cfg = config('services.survey');

        // Use shared helpers for timestamps
        $transactionId = $this->transactionId();
        $processTime = $this->processTime();
        $sessionId = $cfg['session_id'] ?? uniqid();
        $completedDate = $this->completedDate();

        // Use shared helpers for contact info
        $primaryContact = $this->getPrimaryContact();
        $customerCode = $this->customerCode();

        $bandwidth = $data['bandwidth'] ? $this->parseBandwidth($data['bandwidth']) : '';

        $houseNo = $data['survey_address_info']['house_no'] ?? CustomerContext::houseNo('');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
<soapenv:Body>
<ser:HandleSurveyOrderReqMsg>
<ser:RequestHeader>
<com:Version>1</com:Version>
<com:TransactionId>{$transactionId}</com:TransactionId>
<com:SessionId>{$sessionId}</com:SessionId>
<com:ProcessTime>{$processTime}</com:ProcessTime>
<com:Language>2002</com:Language>
<com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
<com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
<com:TenantId>{$cfg['tenant_id']}</com:TenantId>
<com:AccessUser>{$cfg['access_user']}</com:AccessUser>
<com:AccessPwd>{$cfg['access_password']}</com:AccessPwd>
</ser:RequestHeader>
<ser:HandleSurveyOrderReqBody>
<com:CustomerCode>{$customerCode}</com:CustomerCode>
<com:SurveyType>{$data['survey_type']}</com:SurveyType>
<com:TelecomRegion>{$data['telecom_region']}</com:TelecomRegion>
<com:OperType>{$data['oper_type']}</com:OperType>
<com:MainOfferId>{$this->mainOfferId()}</com:MainOfferId>
<com:SurveyAddressInfo>
<com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
<com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
<com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
<com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
<com:HouseNo>{$houseNo}</com:HouseNo>
<com:SupplementAddress>{$data['survey_address_info']['address']}</com:SupplementAddress>
</com:SurveyAddressInfo>
<com:bandwidth>{$bandwidth}</com:bandwidth>
<com:ContactPerson>{$primaryContact['contact_person']}</com:ContactPerson>
<com:ContactNo>{$primaryContact['contact_no']}</com:ContactNo>
<com:ContactEmail>{$primaryContact['contact_email']}</com:ContactEmail>
<com:CompletedDate>{$completedDate}</com:CompletedDate>
<com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
<com:ExtParamList>
<com:ParameterInfo><com:ParamName>NEID</com:ParamName><com:ParamValue>{$resource['neid']}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>CABLETYPE</com:ParamName><com:ParamValue>3</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>LONGITUDE</com:ParamName><com:ParamValue>{$this->formatCoordinate($resource['longitude'])}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>LATITUDE</com:ParamName><com:ParamValue>{$this->formatCoordinate($resource['latitude'])}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>GIS_FLAG</com:ParamName><com:ParamValue>True</com:ParamValue></com:ParameterInfo>
</com:ExtParamList>
</ser:HandleSurveyOrderReqBody>
</ser:HandleSurveyOrderReqMsg>
</soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(array $data, string $xml, array $resource)
    {
        libxml_use_internal_errors(true);
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            $errors = array_map(fn($e) => $e->message, libxml_get_errors());
            libxml_clear_errors();
            return ApiResponse::error('Failed to parse XML response: ' . implode(', ', $errors));
        }

        // Use hardcoded namespace URIs for reliability
        $soapNs = 'http://schemas.xmlsoap.org/soap/envelope/';
        $serNs = 'http://oss.huawei.com/webservice/bss/services';
        $comNs = 'http://www.huawei.com/bss/soaif/interface/common/';

        $body = $parsed->children($soapNs)->Body ?? null;
        if (!$body) {
            return ApiResponse::error('Missing SOAP Body in response');
        }

        $rsp = $body->children($serNs)->HandleSurveyOrderRspMsg ?? null;
        if (!$rsp) {
            return ApiResponse::error('Invalid XML response - missing HandleSurveyOrderRspMsg');
        }

        // Get ser: namespace children for accessing ResponseHeader and HandleSurveyOrderRespBody
        $serChildren = $rsp->children($serNs);

        // Response header (ser:ResponseHeader)
        $header = $serChildren->ResponseHeader ?? null;
        if (!$header) {
            return ApiResponse::error('Invalid response - missing ResponseHeader');
        }

        // Header data is in com: namespace (com:RetCode, com:RetMsg)
        $hdr = $header->children($comNs);
        $retCode = (string) ($hdr->RetCode ?? '1');
        $retMsg = (string) ($hdr->RetMsg ?? 'Unknown error');

        if ($retCode !== '0') {
            return ApiResponse::error($retMsg);
        }

        // HandleSurveyOrderRespBody is in ser: namespace
        $respBody = $serChildren->HandleSurveyOrderRespBody ?? null;
        if (!$respBody) {
            return ApiResponse::error('Invalid response - missing HandleSurveyOrderRespBody');
        }

        $surveyOrderId = (string) $respBody->children($comNs)->CustomerSurveyOrderId;

        if (empty($surveyOrderId)) {
            return ApiResponse::error('Survey order ID not found in response');
        }

        $this->persistSurvey($surveyOrderId, $data, $resource);

        return ApiResponse::success([
            'customer_survey_order_id' => $surveyOrderId
        ]);
    }
}
