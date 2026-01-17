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
        $primaryContact = $this->getPrimaryContact($data);
        $customerCode = $this->customerCode($data['customer_code'] ?? null);

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
<com:Language>{$cfg['language']}</com:Language>
<com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
<com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
<com:TenantId>{$cfg['tenant_id']}</com:TenantId>
<com:AccessUser>{$cfg['access_user']}</com:AccessUser>
<com:AccessPwd>{$cfg['access_password']}</com:AccessPwd>
</ser:RequestHeader>
<ser:HandleSurveyOrderReqBody>
<com:CustomerCode>{$customerCode}</com:CustomerCode>
<com:SurveyType>{$data['survey_type']}</com:SurveyType>
<com:TelecomRegion>{$resource['area_code']}</com:TelecomRegion>
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
<com:ParameterInfo><com:ParamName>LONGITUDE</com:ParamName><com:ParamValue>{$resource['longitude']}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>LATITUDE</com:ParamName><com:ParamValue>{$resource['latitude']}</com:ParamValue></com:ParameterInfo>
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
        $parsed = simplexml_load_string($xml);

        $ns = $parsed->getNamespaces(true);
        $body = $parsed->children($ns['soapenv'])->Body;
        $rsp = $body->children($ns['ser'])->HandleSurveyOrderRspMsg;
        $hdr = $rsp->ResponseHeader->children($ns['com']);

        if ((string) $hdr->RetCode !== '0') {
            return ApiResponse::error((string) $hdr->RetMsg);
        }

        $surveyOrderId = (string) $rsp->HandleSurveyOrderRespBody
            ->children($ns['com'])->CustomerSurveyOrderId;

        $this->persistSurvey($surveyOrderId, $data, $resource);

        return ApiResponse::success([
            'customer_survey_order_id' => $surveyOrderId
        ]);
    }
}
