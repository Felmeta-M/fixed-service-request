<?php

namespace App\Services\Survey;

use App\Services\ApiResponse;
use App\Support\CustomerContext;
use RuntimeException;

class ComboSurveyService extends BaseSurveyService implements SurveyInterface
{
   protected function mainOfferId(): int
   {
      return 180427974;
   }

   protected function mainBandwidth(array $data): ?int
   {
      return $data['bandwidth'] ?? "";
   }

   protected function buildXml(array $data, array $resource): string
   {
      $cfg = config('services.survey');

      // Use shared helpers for timestamps
      $transactionId = $this->transactionId();
      $processTime = $this->processTime();
      $sessionId = $cfg['session_id'] ?? uniqid();
      $completedDate = $this->completedDate();

      // Customer and contact info already set by applyDefaults() in base class
      $customerCode = $data['customer_code'];
      $primaryContact = [
         'contact_person' => $data['contact_person'],
         'contact_no' => $data['contact_no'],
         'contact_email' => $data['contact_email'],
      ];

      // Values already have defaults from applyDefaults() in base class
      $surveyType = $data['survey_type'];
      $telecomRegion = $data['telecom_region'];
      $operType = $data['oper_type'];
      $mainOfferId = $data['main_offer_id'] ?? $this->mainOfferId();
      $bandwidth = $this->parseBandwidth($data['bandwidth']);

      // Get dynamic survey address info from customer or request data
      $address = $this->getCustomerAddress();
      $surveyAddressInfo = [
         'administrative_region_or_city' => $data['survey_address_info']['region_city'] ?? $address['city'],
         'subcity_or_zone' => $data['survey_address_info']['subcity_zone'] ?? $address['zone'],
         'wereda_or_town' => $data['survey_address_info']['wereda_town'] ?? $address['wereda'],
         'kebele' => $data['survey_address_info']['kebele'] ?? $address['kebele'],
         'house_no' => $data['survey_address_info']['house_no'] ?? $address['house_no'],
         'supplement_address' => $data['survey_address_info']['address'] ?? CustomerContext::addressString(''),
      ];

      // Use resource data for sub surveys
      $neid = $resource['neid'] ?? '700041565830';
      $cableType = $resource['cable_type'] ?? '3';

      // Sub survey 1: Voice
      $subSurvey1MainOfferId = '1207609454';
      $subSurvey1ExtParams = [
         ['ParamName' => 'NEID', 'ParamValue' => $neid],
         ['ParamName' => 'CABLETYPE', 'ParamValue' => $cableType],
         ['ParamName' => 'NUMBER_LINE', 'ParamValue' => '1'],
      ];

      // Sub survey 2: Data
      $subSurvey2MainOfferId = '1457567289';
      $subSurvey2ExtParams = [
         ['ParamName' => 'NEID', 'ParamValue' => $neid],
         ['ParamName' => 'CABLETYPE', 'ParamValue' => $cableType],
      ];

      // Main extra params with resource coordinates
      $extParams = [
         ['ParamName' => 'NEID', 'ParamValue' => $neid],
         ['ParamName' => 'CABLETYPE', 'ParamValue' => $cableType],
         ['ParamName' => 'LONGITUDE', 'ParamValue' => $resource['longitude'] ?? '38.733694'],
         ['ParamName' => 'LATITUDE', 'ParamValue' => $resource['latitude'] ?? '9.007778'],
         ['ParamName' => 'GIS_FLAG', 'ParamValue' => 'True'],
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
                <com:Language>2002</com:Language>
                <com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
                <com:TenantId>{$cfg['tenant_id']}</com:TenantId>
                <com:AccessUser>{$cfg['access_user']}</com:AccessUser>
                <com:AccessPwd>{$cfg['access_password']}</com:AccessPwd>
            </ser:RequestHeader>
            <ser:HandleSurveyOrderReqBody>
                <com:CustomerCode>{$customerCode}</com:CustomerCode>
                <com:SurveyType>{$surveyType}</com:SurveyType>
                <com:TelecomRegion>{$data['telecom_region']}</com:TelecomRegion>
                <com:OperType>{$operType}</com:OperType>
                <com:MainOfferId>{$mainOfferId}</com:MainOfferId>

                <com:SurveyAddressInfo>
                    <com:AdministrativeRegionOrCity>{$surveyAddressInfo['administrative_region_or_city']}</com:AdministrativeRegionOrCity>
                    <com:SubcityOrZone>{$surveyAddressInfo['subcity_or_zone']}</com:SubcityOrZone>
                    <com:WeredaOrTown>{$surveyAddressInfo['wereda_or_town']}</com:WeredaOrTown>
                    <com:Kebele>{$surveyAddressInfo['kebele']}</com:Kebele>
                    <com:HouseNo>{$surveyAddressInfo['house_no']}</com:HouseNo>
                    <com:SupplementAddress>{$surveyAddressInfo['supplement_address']}</com:SupplementAddress>
                </com:SurveyAddressInfo>

                <com:SubSurveyinfoList>
                    <com:MainOfferId>{$subSurvey1MainOfferId}</com:MainOfferId>
                    <com:ExtParamList>
                        <com:ParameterInfo><com:ParamName>{$subSurvey1ExtParams[0]['ParamName']}</com:ParamName><com:ParamValue>{$subSurvey1ExtParams[0]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                        <com:ParameterInfo><com:ParamName>{$subSurvey1ExtParams[1]['ParamName']}</com:ParamName><com:ParamValue>{$subSurvey1ExtParams[1]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                        <com:ParameterInfo><com:ParamName>{$subSurvey1ExtParams[2]['ParamName']}</com:ParamName><com:ParamValue>{$subSurvey1ExtParams[2]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                    </com:ExtParamList>
                </com:SubSurveyinfoList>

                <com:SubSurveyinfoList>
                    <com:MainOfferId>{$subSurvey2MainOfferId}</com:MainOfferId>
                    <com:bandwidth>{$bandwidth}</com:bandwidth>
                    <com:ExtParamList>
                        <com:ParameterInfo><com:ParamName>{$subSurvey2ExtParams[0]['ParamName']}</com:ParamName><com:ParamValue>{$subSurvey2ExtParams[0]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                        <com:ParameterInfo><com:ParamName>{$subSurvey2ExtParams[1]['ParamName']}</com:ParamName><com:ParamValue>{$subSurvey2ExtParams[1]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                    </com:ExtParamList>
                </com:SubSurveyinfoList>

                <com:bandwidth>1024</com:bandwidth>
                <com:ContactPerson>{$primaryContact['contact_person']}</com:ContactPerson>
                <com:ContactNo>{$primaryContact['contact_no']}</com:ContactNo>
                <com:ContactEmail>{$primaryContact['contact_email']}</com:ContactEmail>
                <com:CompletedDate>{$completedDate}</com:CompletedDate>

                <com:ExtParamList>
                    <com:ParameterInfo><com:ParamName>{$extParams[0]['ParamName']}</com:ParamName><com:ParamValue>{$extParams[0]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                    <com:ParameterInfo><com:ParamName>{$extParams[1]['ParamName']}</com:ParamName><com:ParamValue>{$extParams[1]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                    <com:ParameterInfo><com:ParamName>{$extParams[2]['ParamName']}</com:ParamName><com:ParamValue>{$extParams[2]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                    <com:ParameterInfo><com:ParamName>{$extParams[3]['ParamName']}</com:ParamName><com:ParamValue>{$extParams[3]['ParamValue']}</com:ParamValue></com:ParameterInfo>
                    <com:ParameterInfo><com:ParamName>{$extParams[4]['ParamName']}</com:ParamName><com:ParamValue>{$extParams[4]['ParamValue']}</com:ParamValue></com:ParameterInfo>
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
