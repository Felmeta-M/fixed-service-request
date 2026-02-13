<?php

namespace App\Services\Survey\Manual;

use App\Enums\OfferId;
use App\Exceptions\ExternalServiceException;

/**
 * Manual survey service for Fixed Data (broadband).
 *
 * Own XML build and parse for data-only manual survey orders.
 */
class ManualDataSurveyService extends BaseManualSurveyService
{
    protected function mainOfferId(): int
    {
        return OfferId::FixedData->value;
    }

    protected function buildRequestXml(array $data): string
    {
        $ctx = $this->getRequestContext($data);
        $cfg = $this->config;

        $bandwidth = $this->parseBandwidth($data['bandwidth'] ?? '7M');

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
                    <com:AdministrativeRegionOrCity>{$ctx['region_city']}</com:AdministrativeRegionOrCity>
                    <com:SubcityOrZone>{$ctx['subcity_zone']}</com:SubcityOrZone>
                    <com:WeredaOrTown>{$ctx['wereda_town']}</com:WeredaOrTown>
                    <com:Kebele>{$ctx['kebele']}</com:Kebele>
                </com:SurveyAddressInfo>
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

        // Persist survey order
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
