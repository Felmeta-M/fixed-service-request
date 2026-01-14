<?php

namespace App\Services;

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
class ChangePrimaryOfferingService extends BaseApiService
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
    public function changeOffering(
        string $objectId,
        string $oldOfferingId,
        ?string $newOfferingId = null,
        int $objectIdType = self::OBJECT_TYPE_SUBSCRIBER
    ): array {
        try {
            $data = [
                'object_id' => $objectId,
                'object_id_type' => $objectIdType,
                'old_offering_id' => $oldOfferingId,
                'new_offering_id' => $newOfferingId,
            ];

            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $result = $this->parseResponse($xmlResponse, $objectId);

            AppLogger::api()->info('Primary offering change requested', [
                'object_id' => $objectId,
                'old_offering_id' => $oldOfferingId,
                'new_offering_id' => $newOfferingId,
                'order_id' => $result['order_id'] ?? null,
                'success' => $result['success'],
            ]);

            return $result;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Change primary offering failed', [
                'object_id' => $objectId,
                'old_offering_id' => $oldOfferingId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Change bandwidth offering for a subscriber.
     * Convenience method for bandwidth changes.
     */
    public function changeBandwidth(string $subscriberId, string $currentOfferingId, ?string $newOfferingId = null): array
    {
        return $this->changeOffering($subscriberId, $currentOfferingId, $newOfferingId, self::OBJECT_TYPE_SUBSCRIBER);
    }

    /**
     * Change and return as API response.
     */
    public function change(string $objectId, string $oldOfferingId, ?string $newOfferingId = null)
    {
        $result = $this->changeOffering($objectId, $oldOfferingId, $newOfferingId);

        if (!$result['success']) {
            return ApiResponse::error($result['error'] ?? 'Change primary offering failed', 500);
        }

        return ApiResponse::success($result);
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

        // Build new offering section if provided
        $newOfferingXml = '';
        if (!empty($data['new_offering_id'])) {
            $newOfferingXml = <<<XML
         <ser:NewPrimaryOffering>
            <com:OfferingId>{$data['new_offering_id']}</com:OfferingId>
         </ser:NewPrimaryOffering>
XML;
        }

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
{$newOfferingXml}
        </ser:ChangePrimaryOfferingReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response.
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

        // Register namespaces
        $namespaces = $parsed->getNamespaces(true);
        $soapNs = $namespaces['soapenv'] ?? 'http://schemas.xmlsoap.org/soap/envelope/';
        $serNs = $namespaces['ser'] ?? 'http://oss.huawei.com/webservice/bss/services';
        $comNs = $namespaces['com'] ?? 'http://www.huawei.com/bss/soaif/interface/common/';

        $body = $parsed->children($soapNs)->Body;
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

        // Parse response header
        $header = $responseMsg->children($serNs)->ResponseHeader;
        $headerData = $header ? $header->children($comNs) : null;

        $responseTime = (string) ($headerData->ResponseTime ?? '');
        $retCode = (string) ($headerData->RetCode ?? '');
        $retMsg = (string) ($headerData->RetMsg ?? '');

        // Parse additional properties (contains CustOrderId)
        $orderId = null;
        $additionalProps = [];

        $additionalProperty = $headerData->AdditionalProperty ?? $header->AdditionalProperty ?? null;
        if ($additionalProperty) {
            foreach ($additionalProperty as $prop) {
                $propData = $prop->children($comNs);
                $code = (string) ($propData->Code ?? $prop->Code ?? '');
                $value = (string) ($propData->Value ?? $prop->Value ?? '');

                if ($code) {
                    $additionalProps[$code] = $value;

                    // Extract order ID
                    if ($code === 'CustOrderId') {
                        $orderId = $value;
                    }
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
