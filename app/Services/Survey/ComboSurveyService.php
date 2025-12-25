<?php

namespace App\Services\Survey;

use App\Models\Customer;
use App\Services\ApiResponse;
use Illuminate\Support\Facades\Auth;
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
      $customer = auth()->check() ? Customer::current() : null;

      $transactionId = $this->transactionId();
      $processTime   = $this->processTime();
      $sessionId     = $cfg['session_id'] ?? uniqid();

      // Default values
      $customerCode = $customer?->code ?? $data['customer_code'] ?? '828285101';
      $surveyType = $data['survey_type'] ?? 'EIC08';
      $telecomRegion = $data['telecom_region'] ?? '2046';
      $operType = $data['oper_type'] ?? 'A';
      $mainOfferId = $data['main_offer_id'] ?? $this->mainOfferId();
      $contactPerson = $data['contact_person'] ?? ($customer?->name ?? 'unknown');
      $contactNo = $data['contact_no'] ?? ($customer ? substr($customer->phone_number, -9) : substr($data['sms_no'], -9));
      $contactEmail = $data['contact_email'] ?? ($customer?->email ?? 'ok@ok.com');
      $completedDate = now()->format('YmdHis');
      $bandwidth     = $data['bandwidth'] ? $this->parseBandwidth($data['bandwidth']) : 5120;

      // Inline survey address info
      $surveyAddressInfo =  [
         'administrative_region_or_city' => '1',
         'subcity_or_zone' => '6028',
         'wereda_or_town' => '7331',
         'kebele' => 'kebele',
         'house_no' => '22',
         'supplement_address' => 'SupplementAddress',
      ];

      // Inline sub survey info (hardcoded)
      $subSurvey1MainOfferId = '1207609454';
      $subSurvey1ExtParams = [
         ['ParamName' => 'NEID', 'ParamValue' => '700041565830'],
         ['ParamName' => 'CABLETYPE', 'ParamValue' => '3'],
         ['ParamName' => 'NUMBER_LINE', 'ParamValue' => '1'],
      ];

      $subSurvey2MainOfferId = '1457567289';
      $subSurvey2Bandwidth = 5120;
      $subSurvey2ExtParams = [
         ['ParamName' => 'NEID', 'ParamValue' => '700041565830'],
         ['ParamName' => 'CABLETYPE', 'ParamValue' => '3'],
      ];

      // Inline extra params
      $extParams = [
         ['ParamName' => 'NEID', 'ParamValue' => '700041565830'],
         ['ParamName' => 'CABLETYPE', 'ParamValue' => '3'],
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
                <com:ContactPerson>{$contactPerson}</com:ContactPerson>
                <com:ContactNo>{$contactNo}</com:ContactNo>
                <com:ContactEmail>{$contactEmail}</com:ContactEmail>
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
