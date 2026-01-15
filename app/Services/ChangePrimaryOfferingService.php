<?php

namespace App\Services;

use App\Models\SurveyOrder;
use App\Services\Logging\AppLogger;
use RuntimeException;

/**
 * Change Primary Offering Service
 * 
 * Changes the primary offering (bandwidth/service plan) for a subscriber.
 * Used to upgrade/downgrade subscriber's service plan (Data/Voice/Combo).
 * 
 * Usage Flow:
 * 1. Query current offering using QueryPurchasedOfferingService (by service number)
 * 2. Extract 'offering_id' from the response
 * 3. Pass that as 'old_offering_id' to changeOffering() method
 * 
 * @see QueryPurchasedOfferingService::queryByServiceNumber()
 */
class ChangeBandwidthService extends BaseApiService
{
    protected int $timeout = 30;
    protected int $rateLimit = 10;

    /**
     * Object ID types for access info.
     */
    public const OBJECT_TYPE_SUBSCRIBER = 4;
    public const OBJECT_TYPE_CUSTOMER = 1;
    public const OBJECT_TYPE_ACCOUNT = 2;

    protected function endpoint(): string
    {
        return config('services.change_primary_offering.endpoint', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF');
    }

    /**
     * Change primary offering for a subscriber.
     *
     * @param string $objectId The subscriber/object ID
     * @param string $oldOfferingId The current offering ID to change from
     * @param string|null $newOfferingId Optional new offering ID (if upgrading to specific plan)
     * @param int $objectIdType Object ID type (default: 4 = Subscriber)
     * @return array Change result with order ID
     */
    public function changeBandwidth(
        string $serviceNumber,
        string $bandwidth,
    ): array {
        try {

            $surveyOrder = SurveyOrder::where('service_number', $serviceNumber)->first();
            if (!$surveyOrder) {
                return [
                    'success' => false,
                    'message' => 'Survey order not found',
                ];
            }

            $data['object_id_type'] = self::OBJECT_TYPE_SUBSCRIBER;
            $data['object_id'] = $serviceNumber;
            $data['old_offering_id'] = $surveyOrder->main_offer_id;
            $data['new_offering_id'] = $surveyOrder->main_offer_id;
            $data['bandwidth'] = $this->parseBandwidth($bandwidth);

            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $result = $this->parseResponse($xmlResponse, $serviceNumber);

            // Return the parsed result
            if (!$result['success']) {
                return $result;
            }

            return [
                'success' => true,
                'message' => 'Primary offering changed successfully',
                'order_id' => $result['order_id'] ?? null,
                'response_time' => $result['response_time'] ?? null,
                'ret_code' => $result['ret_code'] ?? null,
                'ret_msg' => $result['ret_msg'] ?? null,
                'additional_properties' => $result['additional_properties'] ?? [],
            ];
        } catch (RuntimeException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build SOAP XML request for changing primary offering.
     */
    protected function buildXml(array $data): string
    {
        $config = config('services.change_primary_offering');

        $transactionId = $this->transactionId();
        $processTime = $this->processTime();

        // Config values with fallbacks
        $version = $config['version'] ?? '1';
        $language = $config['language'] ?? '2002';
        $channelId = $config['channel_id'] ?? '40';
        $techChannelId = $config['technical_channel_id'] ?? '51';
        $tenantId = $config['tenant_id'] ?? '101';
        $accessUser = $config['access_user'] ?? 'ZTEOSS';
        $accessPwd = $config['access_password'] ?? 'REDACTED_PASSWORD';

        $objectIdType = $data['object_id_type'];
        $objectId = $data['object_id'];
        $oldOfferingId = $data['old_offering_id'];
        $newOfferingId = $data['new_offering_id'];
        $bandwidth = $data['bandwidth'];

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ser="http://oss.huawei.com/webservice/bss/services"
    xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:ChangePrimaryOfferingReqMsg>
            <ser:RequestHeader>
                <com:Version>{$version}</com:Version>
                <com:TransactionId>{$transactionId}</com:TransactionId>
                <com:ProcessTime>{$processTime}</com:ProcessTime>
                <com:Language>{$language}</com:Language>
                <com:ChannelId>{$channelId}</com:ChannelId>
                <com:TechnicalChannelId>{$techChannelId}</com:TechnicalChannelId>
                <com:TenantId>{$tenantId}</com:TenantId>
                <com:AccessUser>{$accessUser}</com:AccessUser>
                <com:AccessPwd>{$accessPwd}</com:AccessPwd>
            </ser:RequestHeader>
            <ser:AccessInfo>
                <com:ObjectIdType>{$objectIdType}</com:ObjectIdType>
                <com:ObjectId>{$objectId}</com:ObjectId>
            </ser:AccessInfo>
            <ser:OldPrimaryOffering>
                <com:OfferingId>{$oldOfferingId}</com:OfferingId>
            </ser:OldPrimaryOffering>
            <ser:NewPrimaryOffering>
            <com:OfferingId>{$newOfferingId}</com:OfferingId>
            <com:InstanceProperty>
                <com:PropertyCode>50020</com:PropertyCode>
                <com:Value>{$bandwidth}</com:Value>
                <ser:EffectiveMode>
                <com:Mode>I</com:Mode>
                </ser:EffectiveMode>
            </com:InstanceProperty>
         </ser:NewPrimaryOffering>
         <ser:ExtParamList>
            <com:ParameterInfo>
               <com:ParamName>ActionType</com:ParamName>
               <com:ParamValue>2</com:ParamValue>                    
            </com:ParameterInfo>
         </ser:ExtParamList>
        </ser:ChangePrimaryOfferingReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response.
     * 
     * Expected success response structure:
     * <soapenv:Envelope>
     *   <soapenv:Body>
     *     <ser:ChangePrimaryOfferingRspMsg>
     *       <ser:ResponseHeader>
     *         <com:ResponseTime>20260114114315</com:ResponseTime>
     *         <com:RetCode>0</com:RetCode>
     *         <com:RetMsg>success</com:RetMsg>
     *         <com:AdditionalProperty>
     *           <com:Code>CustOrderId</com:Code>
     *           <com:Value>20000455498250</com:Value>
     *         </com:AdditionalProperty>
     *       </ser:ResponseHeader>
     *     </ser:ChangePrimaryOfferingRspMsg>
     *   </soapenv:Body>
     * </soapenv:Envelope>
     */
    protected function parseResponse(string $xml, string $objectId): array
    {
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            AppLogger::api()->error('Failed to parse change offering XML response', [
                'object_id' => $objectId,
                'xml_preview' => substr($xml, 0, 500),
            ]);

            return [
                'success' => false,
                'error' => 'Invalid XML response',
            ];
        }

        // Define namespaces - use constants for reliability
        $soapNs = 'http://schemas.xmlsoap.org/soap/envelope/';
        $serNs = 'http://oss.huawei.com/webservice/bss/services';
        $comNs = 'http://www.huawei.com/bss/soaif/interface/common/';

        // Navigate to Body
        $body = $parsed->children($soapNs)->Body;
        if (!$body) {
            AppLogger::api()->error('Missing SOAP Body in response', [
                'object_id' => $objectId,
            ]);
            return [
                'success' => false,
                'error' => 'Missing SOAP Body',
            ];
        }

        // Navigate to ChangePrimaryOfferingRspMsg
        $responseMsg = $body->children($serNs)->ChangePrimaryOfferingRspMsg;
        if (!$responseMsg) {
            AppLogger::api()->error('Missing ChangePrimaryOfferingRspMsg in response', [
                'object_id' => $objectId,
            ]);

            return [
                'success' => false,
                'error' => 'Invalid response structure',
            ];
        }

        // Parse response header (ser:ResponseHeader)
        $header = $responseMsg->children($serNs)->ResponseHeader;
        if (!$header) {
            AppLogger::api()->error('Missing ResponseHeader in response', [
                'object_id' => $objectId,
            ]);
            return [
                'success' => false,
                'error' => 'Missing ResponseHeader',
            ];
        }

        // Get header data with com namespace
        $headerData = $header->children($comNs);

        $responseTime = (string) ($headerData->ResponseTime ?? '');
        $retCode = (string) ($headerData->RetCode ?? '');
        $retMsg = (string) ($headerData->RetMsg ?? '');

        // Parse additional properties (contains CustOrderId)
        $orderId = null;
        $additionalProps = [];

        // AdditionalProperty elements are in com namespace
        foreach ($headerData->AdditionalProperty as $prop) {
            $code = (string) ($prop->Code ?? '');
            $value = (string) ($prop->Value ?? '');

            if ($code) {
                $additionalProps[$code] = $value;

                // Extract order ID
                if ($code === 'CustOrderId') {
                    $orderId = $value;
                }
            }
        }

        // Check for success (0 = success)
        $isSuccess = $retCode === '0' || $retCode === '0000';

        if (!$isSuccess) {
            AppLogger::api()->error('Change primary offering API returned error', [
                'object_id' => $objectId,
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
            ]);

            return [
                'success' => false,
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
                'error' => $retMsg ?: "Change failed with code: {$retCode}",
            ];
        }

        AppLogger::api()->info('Primary offering changed successfully', [
            'object_id' => $objectId,
            'order_id' => $orderId,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
        ]);

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => $responseTime,
            'order_id' => $orderId,
            'additional_properties' => $additionalProps,
        ];
    }
}
