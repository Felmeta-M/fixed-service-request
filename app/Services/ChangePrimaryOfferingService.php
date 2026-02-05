<?php

namespace App\Services;

use App\Enums\OfferId;
use App\Models\BandwidthOption;
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
        return config('services.ng.endpoint');
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
    public function changePrimaryOffering(
        SurveyOrder $surveyOrder,
        string $bandwidth,
    ): array {
        try {
            // Determine the correct service number for BSS API:
            // - Combo services: use data_service_number (the data/FBB line)
            // - Data/Voice services: use voice_service_number or data_service_number
            $serviceNumber = $surveyOrder->data_service_number;

            if (!$this->isValidBandwidthOption($bandwidth)) {
                AppLogger::api()->warning('Invalid bandwidth option provided for upgrade', [
                    'service_number' => $serviceNumber,
                    'bandwidth' => $bandwidth,
                    'operation' => 'change_primary_offering',
                ]);

                return [
                    'success' => false,
                    'error' => 'Invalid bandwidth option. Please select a valid bandwidth from the available options.',
                    'message' => 'The selected bandwidth is not available. Please choose from the valid options.',
                ];
            }

            $data['object_id_type'] = self::OBJECT_TYPE_SUBSCRIBER;
            $data['object_id'] = $serviceNumber; // data service number
            $data['old_offering_id'] = OfferId::FixedData->value;
            $data['new_offering_id'] = OfferId::FixedData->value;
            $data['bandwidth'] = $this->parseBandwidth($bandwidth);

            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $result = $this->parseResponse($xmlResponse, $serviceNumber);

            // Return the parsed result
            if (!$result['success']) {
                return $result;
            }

            // Update local database with new bandwidth after successful change
            // Save as KB for consistency with BSS responses
            $bandwidthKb = $this->parseBandwidth($bandwidth);
            $newOrderId = $result['order_id'] ?? null;

            try {
                $updateData = [
                    'bandwidth' => $bandwidthKb, // Save as KB for consistency with BSS responses
                ];

                // Check if BSS returned a new CustOrderId that differs from existing one
                // When change offer succeeds, BSS creates a new order with new ID
                $existingSubscriptionOrderId = $surveyOrder->customer_subscription_order_id;
                $subscriptionOrderUpdated = false;

                if ($newOrderId && $newOrderId !== $existingSubscriptionOrderId) {
                    $updateData['customer_subscription_order_id'] = $newOrderId;
                    $subscriptionOrderUpdated = true;
                }

                $surveyOrder->update($updateData);

            } catch (\Throwable $e) {
                // Log the error but don't fail the request - the API change was successful
                AppLogger::api()->exception($e, 'Failed to update local data after successful change', [
                    'service_number' => $serviceNumber,
                    'new_bandwidth' => $bandwidth,
                    'new_bandwidth_kb' => $bandwidthKb,
                    'new_order_id' => $newOrderId,
                    'operation' => 'change_primary_offering',
                ]);
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
            AppLogger::api()->exception($e, 'Runtime exception in change primary offering', [
                'service_number' => $serviceNumber,
                'bandwidth' => $bandwidth,
                'operation' => 'change_primary_offering',
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Unexpected error in change primary offering', [
                'service_number' => $serviceNumber,
                'bandwidth' => $bandwidth,
                'operation' => 'change_primary_offering',
            ]);

            return [
                'success' => false,
                'error' => 'An unexpected error occurred. Please try again.',
            ];
        }
    }

    /**
     * Validate if bandwidth option exists in the database.
     * 
     * @param string $bandwidth The bandwidth value to validate (e.g., "10M", "100M")
     * @return bool True if bandwidth is valid, false otherwise
     */
    protected function isValidBandwidthOption(string $bandwidth): bool
    {
        try {
            // Fetch bandwidth options from database
            $bandwidthOption = BandwidthOption::first();

            if (!$bandwidthOption) {
                AppLogger::api()->warning('Bandwidth options not found in database', [
                    'bandwidth' => $bandwidth,
                    'operation' => 'validate_bandwidth',
                ]);
                // If no options in DB, allow the request to proceed (graceful degradation)
                return true;
            }

            // Get all valid options (residential + enterprise)
            $residentialOptions = $bandwidthOption->residential_options ?? [];
            $enterpriseOptions = $bandwidthOption->enterprise_options ?? [];
            $allValidOptions = array_merge($residentialOptions, $enterpriseOptions);

            // Check if the provided bandwidth exists in the valid options
            $isValid = in_array($bandwidth, $allValidOptions, true);

            if (!$isValid) {
                AppLogger::api()->debug('Bandwidth validation failed', [
                    'bandwidth' => $bandwidth,
                    'valid_options' => $allValidOptions,
                    'operation' => 'validate_bandwidth',
                ]);
            }

            return $isValid;
        } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Exception validating bandwidth option', [
                'bandwidth' => $bandwidth,
                'operation' => 'validate_bandwidth',
            ]);
            // On error, allow the request to proceed (graceful degradation)
            return true;
        }
    }

    /**
     * Build SOAP XML request for changing primary offering.
     */
    protected function buildXml(array $data): string
    {
        $config = config('services.ng');

        $transactionId = $this->transactionId();
        $processTime = $this->processTime();

        // Config values from unified NG config
        $version = $config['version'];
        $language = $config['language'];
        $channelId = $config['channel_id'];
        $techChannelId = $config['technical_channel_id'];
        $tenantId = $config['tenant_id'];
        $accessUser = $config['access_user'];
        $accessPwd = $config['access_pwd'];

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
                    <com:OfferingId>
                        <com:OfferingId>{$newOfferingId}</com:OfferingId>
                        </com:OfferingId>       
                        <com:InstanceProperty>
                        <com:PropertyCode>50020</com:PropertyCode>
                        <!--Optional:-->
                        <com:OldValue>?</com:OldValue>
                        <!--You have a CHOICE of the next 2 items at this level-->
                        <com:Value>{$bandwidth}</com:Value>
                        </com:InstanceProperty>
                        <ser:EffectiveMode>
                        <com:Mode>I</com:Mode>
                        </ser:EffectiveMode>
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

    protected function parseResponse(string $xml, string $objectId): array
    {
        try {
            libxml_use_internal_errors(true);
            $parsed = simplexml_load_string($xml);

            if ($parsed === false) {
                $errors = array_map(fn($e) => $e->message, libxml_get_errors());
                libxml_clear_errors();

                AppLogger::api()->error('Failed to parse change offering XML response', [
                    'service_number' => $objectId,
                    'xml_preview' => substr($xml, 0, 500),
                    'errors' => $errors,
                    'operation' => 'change_primary_offering',
                ]);

                return [
                    'success' => false,
                    'error' => 'Invalid XML response from service',
                ];
            }

            // Define namespaces - use constants for reliability
            $soapNs = 'http://schemas.xmlsoap.org/soap/envelope/';
            $serNs = 'http://oss.huawei.com/webservice/bss/services';
            $comNs = 'http://www.huawei.com/bss/soaif/interface/common/';

            // Navigate to Body
            $body = $parsed->children($soapNs)->Body ?? null;
            if (!$body) {
                AppLogger::api()->error('Missing SOAP Body in change offering response', [
                    'service_number' => $objectId,
                    'operation' => 'change_primary_offering',
                ]);
                return [
                    'success' => false,
                    'error' => 'Invalid response structure from service',
                ];
            }

            // Navigate to ChangePrimaryOfferingRspMsg
            $responseMsg = $body->children($serNs)->ChangePrimaryOfferingRspMsg ?? null;
            if (!$responseMsg) {
                AppLogger::api()->error('Missing ChangePrimaryOfferingRspMsg in change offering response', [
                    'service_number' => $objectId,
                    'operation' => 'change_primary_offering',
                ]);

                return [
                    'success' => false,
                    'error' => 'Invalid response message from service',
                ];
            }

            // Parse response header (ser:ResponseHeader)
            $header = $responseMsg->children($serNs)->ResponseHeader ?? null;
            if (!$header) {
                AppLogger::api()->error('Missing ResponseHeader in change offering response', [
                    'service_number' => $objectId,
                    'operation' => 'change_primary_offering',
                ]);
                return [
                    'success' => false,
                    'error' => 'Invalid response header from service',
                ];
            }

            // Get header data with com namespace
            $headerData = $header->children($comNs);

            $responseTime = (string) ($headerData->ResponseTime ?? '');
            $retCode = (string) ($headerData->RetCode ?? '');
            $retMsg = (string) ($headerData->RetMsg ?? 'Unknown error');

            // Parse additional properties (contains CustOrderId)
            $orderId = null;
            $additionalProps = [];

            // AdditionalProperty elements are in com namespace
            if (isset($headerData->AdditionalProperty)) {
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
            }

            // Check for success (0 = success)
            $isSuccess = $retCode === '0' || $retCode === '0000';

            if (!$isSuccess) {
                AppLogger::api()->warning('Change primary offering API returned error', [
                    'service_number' => $objectId,
                    'ret_code' => $retCode,
                    'ret_msg' => $retMsg,
                    'response_time' => $responseTime,
                    'operation' => 'change_primary_offering',
                ]);

                return [
                    'success' => false,
                    'ret_code' => $retCode,
                    'ret_msg' => $retMsg,
                    'response_time' => $responseTime,
                    'error' => $retMsg ?: "Change failed with code: {$retCode}",
                ];
            }

            return [
                'success' => true,
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
                'response_time' => $responseTime,
                'order_id' => $orderId,
                'additional_properties' => $additionalProps,
            ];

        } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Unexpected error parsing change offering response', [
                'service_number' => $objectId,
                'operation' => 'change_primary_offering',
            ]);

            return [
                'success' => false,
                'error' => 'An unexpected error occurred while processing the response.',
            ];
        }
    }
}
