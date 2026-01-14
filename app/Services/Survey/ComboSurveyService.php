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
      $processTime   = $this->processTime();
      $sessionId     = $cfg['session_id'] ?? uniqid();
      $completedDate = $this->completedDate();

      // Use shared helpers for customer and contact info
      $customerCode = $this->customerCode($data['customer_code'] ?? null);
      $primaryContact = $this->getPrimaryContact($data);

      // Default values
      $surveyType = $data['survey_type'] ?? 'EIC08';
      $telecomRegion = $data['telecom_region'] ?? '2046';
      $operType = $data['oper_type'] ?? 'A';
      $mainOfferId = $data['main_offer_id'] ?? $this->mainOfferId();
      $bandwidth = $data['bandwidth'] ? $this->parseBandwidth($data['bandwidth']) : 5120;

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
                <com:Language>{$cfg['language']}</com:Language>
                <com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
                <com:TenantId>{$cfg['tenant_id']}</com:TenantId>
                <com:AccessUser>{$cfg['access_user']}</com:AccessUser>
                <com:AccessPwd>{$cfg['access_password']}</com:AccessPwd>
            </ser:RequestHeader>
            <ser:HandleSurveyOrderReqBody>
                <com:CustomerCode>{$customerCode}</com:CustomerCode>
                <com:SurveyType>{$surveyType}</com:SurveyType>
                <com:TelecomRegion>{$telecomRegion}</com:TelecomRegion>
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
      $parsed = simplexml_load_string($xml);
      $ns = $parsed->getNamespaces(true);
      $body = $parsed->children($ns['soapenv'])->Body;
      $rsp  = $body->children($ns['ser'])->HandleSurveyOrderRspMsg ?? null;

      if (!$rsp) {
         return ApiResponse::error('Invalid XML response');
      }

      $hdr = $rsp->ResponseHeader->children($ns['com'] ?? []);

      if ((string)($hdr->RetCode ?? '1') !== '0') {
         return ApiResponse::error((string)($hdr->RetMsg ?? 'Unknown error'));
      }

      $surveyOrderId = (string)$rsp->HandleSurveyOrderRespBody
         ->children($ns['com'])->CustomerSurveyOrderId;

      $this->persistSurvey($surveyOrderId, $data, $resource);

      return ApiResponse::success([
         'customer_survey_order_id' => $surveyOrderId
      ]);
   }
}
