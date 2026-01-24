<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Exceptions\ExternalServiceException;
use App\Models\Customer;
use App\Models\SurveyOrder;
use App\Models\Zone;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentCalculatorService;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use RuntimeException;
use Throwable;

/**
 * Service for creating manual survey orders via BSS IECAF.
 *
 * This service handles communication with the Huawei BSS system for manual
 * survey order creation, typically used when orders need to be created
 * through the ECAF (Electronic Customer Application Form) system.
 */
class ManualSurveyOrderService extends BaseApiService
{
    protected int $timeout = 30;
    protected int $rateLimit = 15;
    protected int $decaySeconds = 60;

    /**
     * Configuration for the service.
     */
    protected array $config;

    public function __construct(
        protected PaymentCalculatorService $paymentCalculator,
        protected PaymentService $paymentService
    ) {
        $this->config = config('services.manual_survey');
    }

    /**
     * Get the API endpoint.
     */
    protected function endpoint(): string
    {
        return $this->config['endpoint'];
    }

    /**
     * Create a manual survey order.
     *
     * @param array $data Survey order data
     * @return JsonResponse
     */
    public function createSurveyOrder(array $data): JsonResponse
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedResponse = $this->parseResponseXml($data, $xmlResponse);

            return ApiResponse::success($parsedResponse, 'Manual survey order created successfully');
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Manual survey order failed - Runtime error', [
                'customer_code' => $data['customer_code'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            AppLogger::api()->error('Manual survey order creation failed', [
                'exception' => $e->getMessage(),
                'customer_code' => $data['customer_code'] ?? null,
            ]);

            return ApiResponse::fromException($e, 'Manual survey order creation failed');
        }
    }

    /**
     * Build the SOAP XML request for manual survey order creation.
     *
     * @param array $data Survey order data
     * @return string SOAP XML payload
     */
    protected function buildRequestXml(array $data): string
    {
        $transactionId = $this->generateTransactionId();
        $processTime = $this->processTime();
        $completedDate = $this->completedDate();

        // Use shared customer context helpers
        $customerCode = $this->customerCode();

        // Use telecom_region from request (area_id selected by customer in frontend)
        // Falls back to fetchZoneCode for backward compatibility
        $addressInfo = $data['survey_address_info'] ?? [];
        $zoneId = $data['zone_id'] ?? ($addressInfo['zone_id'] ?? null);
        $telecomRegion = $data['telecom_region'] ?? $this->fetchZoneCode($zoneId) ?? '104';
        $operType = $data['oper_type'] ?? 'A';

        // Convert bandwidth from MB to KB (BSS expects KB)
        $bandwidth = $this->parseBandwidth($data['bandwidth'] ?? '');

        // Use shared contact helpers
        $primaryContact = $this->getPrimaryContact($data);

        // Extract address info
        $regionCity = $addressInfo['region_city'] ?? $addressInfo['administrative_region_city'] ?? '';
        $subcityZone = $addressInfo['subcity_zone'] ?? '';
        $weredaTown = $addressInfo['wereda_town'] ?? '';
        $kebele = $addressInfo['kebele'] ?? '';

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ser="http://oss.huawei.com/webservice/bss/services"
    xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:HandleSurveyOrderReqMsg>
            <ser:RequestHeader>
                <com:Version>{$this->config['version']}</com:Version>
                <com:TransactionId>{$transactionId}</com:TransactionId>
                <com:ProcessTime>{$processTime}</com:ProcessTime>
                <com:Language>{$this->config['language']}</com:Language>
                <com:ChannelId>{$this->config['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$this->config['technical_channel_id']}</com:TechnicalChannelId>
                <com:TenantId>{$this->config['tenant_id']}</com:TenantId>
                <com:AccessUser>{$this->config['access_user']}</com:AccessUser>
                <com:AccessPwd>{$this->config['access_password']}</com:AccessPwd>
                <com:OperatorId>{$this->config['operator_id']}</com:OperatorId>
            </ser:RequestHeader>
            <ser:HandleSurveyOrderReqBody>
                <com:CustomerCode>{$customerCode}</com:CustomerCode>
                <com:SurveyType>{$data['survey_type']}</com:SurveyType>
                <com:TelecomRegion>{$telecomRegion}</com:TelecomRegion>
                <com:OperType>{$operType}</com:OperType>
                <com:MainOfferId>{$data['main_offer_id']}</com:MainOfferId>
                <com:SurveyAddressInfo>
                    <com:AdministrativeRegionOrCity>{$regionCity}</com:AdministrativeRegionOrCity>
                    <com:SubcityOrZone>{$subcityZone}</com:SubcityOrZone>
                    <com:WeredaOrTown>{$weredaTown}</com:WeredaOrTown>
                    <com:Kebele>{$kebele}</com:Kebele>
                </com:SurveyAddressInfo>
                <com:bandwidth>{$bandwidth}</com:bandwidth>
                <com:ContactPerson>{$primaryContact['contact_person']}</com:ContactPerson>
                <com:ContactNo>{$primaryContact['contact_no']}</com:ContactNo>
                <com:ContactEmail>{$primaryContact['contact_email']}</com:ContactEmail>
                <com:CompletedDate>{$completedDate}</com:CompletedDate>
            </ser:HandleSurveyOrderReqBody>
        </ser:HandleSurveyOrderReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse the SOAP XML response.
     *
     * @param array $data Original request data
     * @param string $xml SOAP XML response
     * @return array Parsed response data
     * @throws ExternalServiceException If response indicates failure
     */
    protected function parseResponseXml(array $data, string $xml): array
    {
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            throw ExternalServiceException::invalidResponse(
                'manual_survey',
                'Failed to parse SOAP response'
            );
        }

        $namespaces = $parsed->getNamespaces(true);
        $body = $parsed->children($namespaces['soapenv'])->Body;
        $responseMsg = $body->children($namespaces['ser'])->HandleSurveyOrderRspMsg;

        // Parse response header
        $responseHeader = $responseMsg->children($namespaces['ser'])->ResponseHeader
            ?? $responseMsg->ResponseHeader;
        $responseHeaderData = $responseHeader->children($namespaces['com']);

        // Parse response body
        $responseBody = $responseMsg->children($namespaces['ser'])->HandleSurveyOrderRespBody
            ?? $responseMsg->HandleSurveyOrderRespBody;
        $responseBodyData = $responseBody->children($namespaces['com']);

        $retCode = (string) ($responseHeaderData->RetCode ?? '');
        $retMsg = (string) ($responseHeaderData->RetMsg ?? '');
        $responseTime = (string) ($responseHeaderData->ResponseTime ?? '');

        // Check for BSS errors
        if ($retCode !== '0') {
            AppLogger::api()->warning('Manual survey order BSS returned error', [
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
                'customer_code' => $data['customer_code'] ?? null,
            ]);

            throw ExternalServiceException::errorResponse(
                'manual_survey',
                (int) $retCode,
                "BSS Error: {$retMsg}",
                $xml
            );
        }

        $customerSurveyOrderId = (string) ($responseBodyData->CustomerSurveyOrderId ?? '');

        // Create local survey order record
        $this->persistSurvey($customerSurveyOrderId, $data);

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => $responseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
        ];
    }

    /**
     * Persist local survey order record.
     *
     * @param string $customerSurveyOrderId BSS survey order ID
     * @param array $data Survey order data
     * @return SurveyOrder
     */
    protected function persistSurvey(string $customerSurveyOrderId, array $data): SurveyOrder
    {
        // Use shared customer context helpers
        $customerCode = $this->customerCode($data['customer_code'] ?? '');
        $primaryContact = $this->getPrimaryContact($data);

        // Use telecom_region from request (area_id selected by customer in frontend)
        // Falls back to fetchZoneCode for backward compatibility
        $addressInfo = $data['survey_address_info'] ?? [];
        $zoneId = $data['zone_id'] ?? ($addressInfo['zone_id'] ?? null);
        $telecomRegionAreaId = $data['telecom_region'] ?? $this->fetchZoneCode($zoneId) ?? '104';

        // Convert bandwidth to KB for consistent storage (BSS returns KB format)
        $bandwidthKb = null;
        if (!empty($data['bandwidth'])) {
            $bandwidthKb = $this->parseBandwidth($data['bandwidth']);
        }

        // Extract area_code and area_name from survey_address_info if available
        $areaCode = $addressInfo['area_code'] ?? null;
        $areaName = $addressInfo['area_name'] ?? null;

        $survey = SurveyOrder::create([
            'customer_code' => $customerCode,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'main_offer_id' => $data['main_offer_id'],
            'survey_type' => $data['survey_type'],
            'telecom_region' => $telecomRegionAreaId,
            'oper_type' => $data['oper_type'] ?? 'A',
            'customer_type' => 'residential',
            'bandwidth' => $bandwidthKb, // Save as KB for consistency with BSS responses
            'contact_person' => $primaryContact['contact_person'],
            'contact_no' => $primaryContact['contact_no'],
            'contact_email' => $primaryContact['contact_email'],
            'status' => FFDServiceProvisionStatus::Waiting->value,
            'survey_is_manual' => true,
            // For manual surveys: device selection happens AFTER survey completion
            // when we know the media_type (PON/COPPER) from BSS response.
            // Set to null initially - will be updated when customer selects device.
            'with_device' => null,
            'device_id' => null,
            'device_voice_id' => null,
            'area_code' => $areaCode,
            'area_name' => $areaName,
            // Manual survey fields - will be populated from BSS response after survey completion
            'media_type' => null, // Set from BSS param 50005 (PON/COPPER), null if failed (-1)
            'cable_type' => null, // Set from BSS param 50056 (0-5)
            'line_indicator' => null,  // Set from BSS param 50112
            'survey_failure_reason' => null, // Set from CauseContent when 50005 = -1
        ]);

        // Persist payment for manual survey (without cable charge)
        $this->persistPayment($survey, $data);

        return $survey;
    }

    /**
     * Persist payment for manual survey order (without cable charge, but includes device fee).
     *
     * @param SurveyOrder $survey
     * @param array $data Original request data
     * @return void
     */
    protected function persistPayment(SurveyOrder $survey, array $data): void
    {
        $customer = Auth::guard('api')->user();
        if (!$customer) {
            AppLogger::api()->warning('Cannot calculate payment - no authenticated customer', [
                'customer_survey_order_id' => $survey->customer_survey_order_id,
            ]);
            return;
        }

        // Build request data for subscription fee calculation
        $profile = $this->getCustomerProfile();
        $requestData = [
            'service_number' => $data['service_number'] ?? null,
            'offering_id' => $survey->main_offer_id,
            'network_type' => 4, // Fixed network
            'sub_type' => 0,
            'customer_type' => $profile['customer_type'],
            'customer_category' => $profile['customer_category'],
            'customer_subcategory' => $profile['customer_subcategory'],
            'customer_level' => $profile['customer_level'],
            'customer_nationality' => $profile['nationality'],
            'customer_id_type' => $profile['identification_type'],
        ];

        // Calculate fees without cable charge for manual survey
        $fees = $this->paymentCalculator->calculateFeesWithoutCable($survey, $requestData);

        // Calculate device fee from selected device prices
        // Device storage logic:
        // - Voice-only (1207609454): device_id contains voice device
        // - Broadband (1457567289): device_id contains internet device
        // - Combo (180427974): device_id contains internet device, device_voice_id contains voice device
        $deviceFee = 0;
        if ($survey->with_device) {
            $mainOfferId = (int) $survey->main_offer_id;
            $isCombo = $mainOfferId === 180427974;
            $isVoiceOnly = $mainOfferId === 1207609454;

            if ($isCombo) {
                // Combo service: device_id is internet, device_voice_id is voice
                if ($survey->device_id) {
                    $internetDevice = \App\Models\AvailableDevice::find($survey->device_id);
                    $deviceFee += $internetDevice ? (float) $internetDevice->price : 0;
                }
                if ($survey->device_voice_id) {
                    $voiceDevice = \App\Models\AvailableDevice::find($survey->device_voice_id);
                    $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
                }
            } elseif ($isVoiceOnly) {
                // Voice-only service: device_id contains voice device
                if ($survey->device_id) {
                    $voiceDevice = \App\Models\AvailableDevice::find($survey->device_id);
                    $deviceFee += $voiceDevice ? (float) $voiceDevice->price : 0;
                }
            } else {
                // Broadband service: device_id contains internet device
                if ($survey->device_id) {
                    $internetDevice = \App\Models\AvailableDevice::find($survey->device_id);
                    $deviceFee += $internetDevice ? (float) $internetDevice->price : 0;
                }
            }
        }

        $totalAmount = $fees['total_amount'] + $deviceFee;

        $this->paymentService->createOrUpdatePayment([
            'customer_survey_order_id' => $survey->customer_survey_order_id,
            'service_number' => $data['service_number'] ?? null,
            'subscription_fee' => $fees['subscription_fee'],
            'cable_charge' => 0,
            'device_fee' => $deviceFee,
            'total_amount' => $totalAmount,
        ]);
    }

    /**
     * Generate a unique transaction ID.
     *
     * @return string Transaction ID in format YYYYMMDDHHmmssXXX
     */
    protected function generateTransactionId(): string
    {
        return now()->format('YmdHis') . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get email from customer's contact info.
     */
    protected function getCustomerEmail(?Customer $customer): ?string
    {
        if (!$customer) {
            return null;
        }

        // Try to get email from contact array
        $contact = $customer->contact;
        if (is_array($contact) && isset($contact['email'])) {
            return $contact['email'];
        }

        return null;
    }

    /**
     * Map customer-selected zone_id to Ethio zone code (telecom region).
     *
     * @param int|string|null $zoneId
     * @return string|null Ethio zone code or null if not found
     */
    protected function fetchZoneCode(int|string|null $zoneId): ?string
    {
        $zoneId = $zoneId !== null ? (int) $zoneId : null;

        if (!$zoneId) {
            return null;
        }

        $zone = Zone::query()
            ->where('id', $zoneId)
            ->where('status', true)
            ->first();

        if ($zone && !empty($zone->zone_code)) {
            AppLogger::api()->info('Telecom region resolved from customer zone selection', [
                'zone_id' => $zoneId,
                'zone_code' => $zone->zone_code,
            ]);

            return (string) $zone->zone_code;
        }

        AppLogger::api()->warning('Failed to resolve telecom region from zone_id', [
            'zone_id' => $zoneId,
        ]);

        return null;
    }

    /**
     * Find a survey order by customer survey order ID.
     *
     * @param string $customerSurveyOrderId BSS survey order ID
     * @return SurveyOrder|null
     */
    public function find(string $customerSurveyOrderId): ?SurveyOrder
    {
        return SurveyOrder::where('customer_survey_order_id', $customerSurveyOrderId)->first();
    }
}
