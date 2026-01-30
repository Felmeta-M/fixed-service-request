<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
use RuntimeException;

/**
 * Query Purchased Primary Offering Service
 * 
 * Queries the BSS system to get the current primary offering purchased by a subscriber.
 * Used to check what service plan (Data/Voice/Combo) a subscriber currently has.
 */
class QueryPurchasedOfferingService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 30;

    /**
     * Object ID types for querying.
     */
    public const OBJECT_TYPE_SUBSCRIBER = 4;
    public const OBJECT_TYPE_CUSTOMER = 1;
    public const OBJECT_TYPE_ACCOUNT = 2;

    /**
     * BSS Property code mappings for human-readable names.
     */
    public const PROPERTY_CODES = [
        '729212' => 'bandwidth',           // Bandwidth code (e.g., 050120262)
        '729211' => 'device_type',         // CPE/Device type (e.g., 2703DTU)
        '519309' => 'activation_date',     // Activation date
        '50135'  => 'cpe_type',            // CPE Type
        '50134'  => 'cpe_serial',          // CPE Serial
    ];

    /**
     * Property codes that represent bandwidth.
     */
    public const BANDWIDTH_PROPERTY_CODE = '729212';
    public const DEVICE_TYPE_PROPERTY_CODE = '729211';
    public const ACTIVATION_DATE_PROPERTY_CODE = '519309';

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    /**
     * Query purchased primary offering by subscriber/object ID.
     *
     * @param string $objectId The subscriber/object ID to query
     * @param int $objectIdType Object ID type (default: 4 = Subscriber)
     * @return array Purchased offering details
     */
    public function queryByObjectId(string $objectId, int $objectIdType = self::OBJECT_TYPE_SUBSCRIBER): array
    {
        try {
            $data = [
                'object_id' => $objectId,
                'object_id_type' => $objectIdType,
            ];

            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $result = $this->parseResponse($xmlResponse, $objectId);

            return $result;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Query purchased offering failed', [
                'object_id' => $objectId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Query purchased offering by service number.
     * Convenience method that uses subscriber object type.
     */
    public function queryByServiceNumber(string $serviceNumber): array
    {
        return $this->queryByObjectId($serviceNumber, self::OBJECT_TYPE_SUBSCRIBER);
    }

    /**
     * Query and return as API response.
     */
    public function query(string $objectId, int $objectIdType = self::OBJECT_TYPE_SUBSCRIBER)
    {
        $result = $this->queryByObjectId($objectId, $objectIdType);

        if (!$result['success']) {
            return ApiResponse::error($result['error'] ?? 'Query purchased offering failed', 500);
        }

        return ApiResponse::success($result);
    }

    /**
     * Check if subscriber has a specific offering.
     */
    public function hasOffering(string $objectId, string $offeringId): bool
    {
        $result = $this->queryByObjectId($objectId);
        return ($result['offering_id'] ?? '') === $offeringId;
    }

    /**
     * Get offering name for a subscriber.
     */
    public function getOfferingName(string $objectId): ?string
    {
        $result = $this->queryByObjectId($objectId);
        return $result['offering_name'] ?? null;
    }

    /**
     * Build SOAP XML request for querying purchased primary offering.
     */
    protected function buildXml(array $data): string
    {
        $config = config('services.ng');

        $transactionId = $this->transactionId();
        $reqTime = $this->processTime();

        // Use unified NG config
        $channel = $config['channel_id'];
        $partnerId = $config['tenant_id'];
        $accessUser = $config['access_user'];
        $accessPassword = $config['access_pwd'];

        $objectIdType = $data['object_id_type'];
        $objectId = $data['object_id'];

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:off="http://www.huawei.com/bss/soaif/interface/OfferingService/"
    xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <off:QueryPurchasedPrimaryOfferingReqMsg>
            <com:ReqHeader>
                <com:TransactionId>{$transactionId}</com:TransactionId>
                <com:Channel>{$channel}</com:Channel>
                <com:PartnerId>{$partnerId}</com:PartnerId>
                <com:ReqTime>{$reqTime}</com:ReqTime>
                <com:AccessUser>{$accessUser}</com:AccessUser>
                <com:AccessPassword>{$accessPassword}</com:AccessPassword>
                <com:AdditionalProperty>
                    <com:Code>1</com:Code>
                    <com:Value>1</com:Value>
                </com:AdditionalProperty>
            </com:ReqHeader>
            <off:AccessInfo>
                <com:ObjectIdType>{$objectIdType}</com:ObjectIdType>
                <com:ObjectId>{$objectId}</com:ObjectId>
            </off:AccessInfo>
        </off:QueryPurchasedPrimaryOfferingReqMsg>
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
            AppLogger::api()->error('Failed to parse purchased offering XML response', [
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
        $offNs = $namespaces['off'] ?? 'http://www.huawei.com/bss/soaif/interface/OfferingService/';
        $comNs = $namespaces['com'] ?? 'http://www.huawei.com/bss/soaif/interface/common/';

        $body = $parsed->children($soapNs)->Body;
        $responseMsg = $body->children($offNs)->QueryPurchasedPrimaryOfferingRspMsg;

        if (!$responseMsg) {
            AppLogger::api()->error('Missing QueryPurchasedPrimaryOfferingRspMsg in response', [
                'object_id' => $objectId,
            ]);

            return [
                'success' => false,
                'error' => 'Invalid response structure',
            ];
        }

        // Parse response header
        $header = $responseMsg->children($comNs)->RspHeader ?? $responseMsg->RspHeader;
        if (!$header) {
            $header = $responseMsg->children($offNs)->RspHeader;
        }

        $headerData = $header ? $header->children($comNs) : null;

        $returnCode = (string) ($headerData->ReturnCode ?? $header->ReturnCode ?? '');
        $returnMsg = (string) ($headerData->ReturnMsg ?? $header->ReturnMsg ?? '');
        $rspTime = (string) ($headerData->RspTime ?? $header->RspTime ?? '');

        // Check for success (0000 = success)
        if ($returnCode !== '0000' && $returnCode !== '0') {
            AppLogger::api()->error('Query purchased offering API returned error', [
                'object_id' => $objectId,
                'return_code' => $returnCode,
                'return_msg' => $returnMsg,
            ]);

            return [
                'success' => false,
                'return_code' => $returnCode,
                'return_msg' => $returnMsg,
                'error' => $returnMsg ?: "Query failed with code: {$returnCode}",
            ];
        }

        // Parse primary offering
        $primaryOffering = $responseMsg->children($offNs)->PrimaryOffering ?? $responseMsg->PrimaryOffering;

        if (!$primaryOffering) {
            return [
                'success' => true,
                'return_code' => $returnCode,
                'return_msg' => $returnMsg,
                'response_time' => $rspTime,
                'has_offering' => false,
                'offering_id' => null,
                'offering_name' => null,
            ];
        }

        $offeringData = $primaryOffering->children($offNs);

        // Get OfferingId details
        $offeringIdNode = $offeringData->OfferingId ?? $primaryOffering->OfferingId;
        $offeringIdInner = $offeringIdNode ? $offeringIdNode->children($comNs) : null;

        $offeringId = (string) ($offeringIdInner->OfferingId ?? $offeringIdNode->OfferingId ?? '');
        $purchaseSeq = (string) ($offeringIdInner->PurchaseSeq ?? $offeringIdNode->PurchaseSeq ?? '');

        $offeringName = (string) ($offeringData->OfferingName ?? $primaryOffering->OfferingName ?? '');
        $effectiveDate = (string) ($offeringData->EffectiveDate ?? $primaryOffering->EffectiveDate ?? '');
        $expireDate = (string) ($offeringData->ExpireDate ?? $primaryOffering->ExpireDate ?? '');

        // Parse property list with human-readable names
        $rawProperties = [];
        $namedProperties = [];
        $propertyList = $offeringData->PropertyList ?? $primaryOffering->PropertyList ?? [];

        foreach ($propertyList as $property) {
            $propData = $property->children($comNs);
            $propertyCode = (string) ($propData->PropertyCode ?? $property->PropertyCode ?? '');
            $propertyValue = (string) ($propData->Value ?? $property->Value ?? '');

            if ($propertyCode) {
                $rawProperties[$propertyCode] = $propertyValue;

                // Map to human-readable name if known
                $propertyName = self::PROPERTY_CODES[$propertyCode] ?? "property_{$propertyCode}";
                $namedProperties[$propertyName] = $propertyValue;
            }
        }

        // Extract key properties for easy access
        $bandwidth = $rawProperties[self::BANDWIDTH_PROPERTY_CODE] ?? null;
        $deviceType = $rawProperties[self::DEVICE_TYPE_PROPERTY_CODE] ?? null;
        $activationDate = $rawProperties[self::ACTIVATION_DATE_PROPERTY_CODE] ?? null;

        AppLogger::api()->debug('Purchased offering parsed', [
            'object_id' => $objectId,
            'offering_id' => $offeringId,
            'offering_name' => $offeringName,
            'bandwidth' => $bandwidth,
        ]);

        return [
            'success' => true,
            'return_code' => $returnCode,
            'return_msg' => $returnMsg,
            'response_time' => $rspTime,
            'has_offering' => !empty($offeringId),
            'offering_id' => $offeringId,
            'purchase_seq' => $purchaseSeq,
            'offering_name' => $offeringName,
            'effective_date' => $effectiveDate,
            'expire_date' => $expireDate,
            // Key properties extracted for easy access
            'bandwidth' => $bandwidth,
            'device_type' => $deviceType,
            'activation_date' => $activationDate,
            // All properties with human-readable names
            'properties' => $namedProperties,
            // Raw properties with original codes (for debugging)
            'raw_properties' => $rawProperties,
        ];
    }

    /**
     * Get property name from code.
     */
    public static function getPropertyName(string $code): string
    {
        return self::PROPERTY_CODES[$code] ?? "property_{$code}";
    }
}
