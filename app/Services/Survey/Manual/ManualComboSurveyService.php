<?php

namespace App\Services\Survey\Manual;

use App\Enums\OfferId;
use App\Exceptions\ExternalServiceException;
use App\Support\CustomerContext;

/**
 * Manual survey service for Fixed Combo (Voice + Data).
 *
 * Own XML build and parse for combo manual survey orders:
 * SubSurveyinfoList for Voice and Data, ExtParamList with placeholder NEID/CABLETYPE/LONGITUDE/LATITUDE.
 */
class ManualComboSurveyService extends BaseManualSurveyService
{
    protected function mainOfferId(): int
    {
        return OfferId::FixedCombo->value;
    }

    protected function buildRequestXml(array $data): string
    {
        $ctx = $this->getRequestContext($data);
        $cfg = $this->config;
        $bandwidth = $this->parseBandwidth($data['bandwidth'] ?? '');
        $address = $this->getCustomerAddress();
        $surveyAddressInfo = [
            'administrative_region_or_city' => $data['survey_address_info']['region_city'] ?? $address['city'],
            'subcity_or_zone' => $data['survey_address_info']['subcity_zone'] ?? $address['zone'],
            'wereda_or_town' => $data['survey_address_info']['wereda_town'] ?? $address['wereda'],
            'kebele' => $data['survey_address_info']['kebele'] ?? $address['kebele'],
            'house_no' => $data['survey_address_info']['house_no'] ?? $address['house_no'],
            'supplement_address' => $data['survey_address_info']['address'] ?? CustomerContext::addressString(''),
        ];


        $subSurveyVoiceOfferId = OfferId::FixedVoice->value;
        $subSurveyDataOfferId = OfferId::FixedData->value;

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ser="http://oss.huawei.com/webservice/bss/services"
    xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:HandleSurveyOrderReqMsg>
            <ser:RequestHeader>
                <com:Version>{$cfg['version']}</com:Version>
                <com:TransactionId>{$ctx['transaction_id']}</com:TransactionId>
                <com:ProcessTime>{$ctx['process_time']}</com:ProcessTime>
                <com:Language>{$cfg['language']}</com:Language>
                <com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
                <com:TenantId>{$cfg['tenant_id']}</com:TenantId>
                <com:AccessUser>{$cfg['access_user']}</com:AccessUser>
                <com:AccessPwd>{$cfg['access_pwd']}</com:AccessPwd>
                <com:OperatorId>{$cfg['access_user']}</com:OperatorId>
            </ser:RequestHeader>
            <ser:HandleSurveyOrderReqBody>
                <com:CustomerCode>{$ctx['customer_code']}</com:CustomerCode>
                <com:SurveyType>{$data['survey_type']}</com:SurveyType>
                <com:TelecomRegion>{$ctx['telecom_region']}</com:TelecomRegion>
                <com:OperType>{$ctx['oper_type']}</com:OperType>
                <com:MainOfferId>{$this->mainOfferId()}</com:MainOfferId>

                <com:SurveyAddressInfo>
                    <com:AdministrativeRegionOrCity>{$surveyAddressInfo['administrative_region_or_city']}</com:AdministrativeRegionOrCity>
                    <com:SubcityOrZone>{$surveyAddressInfo['subcity_or_zone']}</com:SubcityOrZone>
                    <com:WeredaOrTown>{$surveyAddressInfo['wereda_or_town']}</com:WeredaOrTown>
                    <com:Kebele>{$surveyAddressInfo['kebele']}</com:Kebele>
                    <com:HouseNo>{$surveyAddressInfo['house_no']}</com:HouseNo>
                    <com:SupplementAddress>{$surveyAddressInfo['supplement_address']}</com:SupplementAddress>
                </com:SurveyAddressInfo>

                <com:SubSurveyinfoList>
                    <com:MainOfferId>{$subSurveyVoiceOfferId}</com:MainOfferId>
                </com:SubSurveyinfoList>

                <com:SubSurveyinfoList>
                    <com:MainOfferId>{$subSurveyDataOfferId}</com:MainOfferId>
                    <com:bandwidth>{$bandwidth}</com:bandwidth>
                </com:SubSurveyinfoList>

                <com:bandwidth>{$bandwidth}</com:bandwidth>
                <com:ContactPerson>{$ctx['primary_contact']['contact_person']}</com:ContactPerson>
                <com:ContactNo>{$ctx['primary_contact']['contact_no']}</com:ContactNo>
                <com:ContactEmail>{$ctx['primary_contact']['contact_email']}</com:ContactEmail>
                <com:CompletedDate>{$ctx['completed_date']}</com:CompletedDate>
            </ser:HandleSurveyOrderReqBody>
        </ser:HandleSurveyOrderReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * @throws ExternalServiceException
     */
    protected function parseResponseXml(array $data, string $xml): array
    {
        $parsed = $this->parseHandleSurveyOrderResponse($data, $xml);
        $this->persistSurvey($parsed['customer_survey_order_id'], $data);

        return [
            'success' => true,
            'ret_code' => $parsed['ret_code'],
            'ret_msg' => $parsed['ret_msg'],
            'response_time' => $parsed['response_time'],
            'customer_survey_order_id' => $parsed['customer_survey_order_id'],
        ];
    }
}
