<?php

namespace App\Services\Survey\Manual;

use App\Enums\FFDServiceProvisionStatus;
use App\Enums\OfferId;
use App\Exceptions\ExternalServiceException;
use App\Models\Customer;
use App\Models\SurveyOrder;
use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use App\Services\Payment\DeviceFeeCalculatorService;
use App\Services\Payment\PaymentCalculatorService;
use App\Services\Payment\PaymentService;
use App\Services\ZoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use RuntimeException;
use Throwable;
use App\Support\CustomerContext;

/**
 * Base service for manual survey orders (Fixed Data, Fixed Voice, Fixed Combo).
 *
 * Manual surveys are created via BSS IECAF when geo-fencing is not used.
 * Each subclass implements its own buildRequestXml and parseResponseXml.
 */
abstract class BaseManualSurveyService extends BaseApiService
{
    protected int $timeout = 30;
    protected int $rateLimit = 30;
    protected int $decaySeconds = 60;

    protected array $config;

    public function __construct(
        protected PaymentCalculatorService $paymentCalculator,
        protected PaymentService $paymentService,
        protected DeviceFeeCalculatorService $deviceFeeCalculator,
        protected ZoneService $zoneService
    ) {
        $this->config = config('services.ng');
    }

    protected function endpoint(): string
    {
        return $this->config['endpoint'];
    }

    /**
     * Main offer ID for this manual survey type (Fixed Data, Fixed Voice, or Fixed Combo).
     */
    abstract protected function mainOfferId(): int;

    /**
     * Build the SOAP XML request for this manual survey type.
     */
    abstract protected function buildRequestXml(array $data): string;

    /**
     * Parse the SOAP XML response for this manual survey type.
     *
     * @return array{success: bool, ret_code: string, ret_msg: string, response_time: string, customer_survey_order_id: string}
     * @throws ExternalServiceException If response indicates failure
     */
    abstract protected function parseResponseXml(array $data, string $xml): array;

    /**
     * Create a manual survey order.
     */
    public function createSurveyOrder(array $data): JsonResponse
    {
        try {
            $data = $this->resolveTelecomRegionFromCoordinates($data);
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedResponse = $this->parseResponseXml($data, $xmlResponse);

            return ApiResponse::success($parsedResponse, 'Manual survey order created successfully');
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Manual survey order failed - Runtime error', [
                'customer_code' => $data['customer_code'] ?? null,
                'main_offer_id' => $this->mainOfferId(),
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::safeError($e, 'Manual survey order creation failed. Please try again.');
        } catch (Throwable $e) {
            AppLogger::api()->error('Manual survey order creation failed', [
                'exception' => $e->getMessage(),
                'customer_code' => $data['customer_code'] ?? null,
                'main_offer_id' => $this->mainOfferId(),
            ]);

            return ApiResponse::fromException($e, 'Manual survey order creation failed');
        }
    }

    /**
     * Resolve telecom_region (area_id) from latitude/longitude when not provided.
     * Uses ethio_shops table to find nearest shop and map its zone to TelecomRegion.area_id.
     */
    protected function resolveTelecomRegionFromCoordinates(array $data): array
    {
        if (!empty($data['telecom_region'])) {
            return $data;
        }

        $addressInfo = $data['survey_address_info'] ?? [];
        $lat = $addressInfo['latitude'] ?? null;
        $lng = $addressInfo['longitude'] ?? null;

        if ($lat === null || $lng === null || $lat === '' || $lng === '') {
            return $data;
        }

        $areaId = $this->zoneService->getAreaIdFromCoordinates((float) $lat, (float) $lng);
        if ($areaId !== null) {
            $data['telecom_region'] = $areaId;
        }

        return $data;
    }

    /**
     * Common request context for building XML (transactionId, processTime, address, contact, etc.).
     */
    protected function getRequestContext(array $data): array
    {
        $addressInfo = $data['survey_address_info'] ?? [];
        $zoneId = $data['zone_id'] ?? ($addressInfo['zone_id'] ?? null);

        $telecomRegion = $data['telecom_region']
            ?? $this->fetchZoneCode($zoneId)
            ?? '';

        return [
            'transaction_id' => $this->generateTransactionId(),
            'process_time' => $this->processTime(),
            'completed_date' => $this->completedDate(),
            'customer_code' => $this->customerCode(),
            'telecom_region' => $telecomRegion,
            'oper_type' => 'A',
            'primary_contact' => $this->getPrimaryContact($data),
            'region_city' => $addressInfo['region_city'] ?? CustomerContext::region(''),
            'subcity_zone' => $addressInfo['subcity_zone'] ?? CustomerContext::zone(''),
            'wereda_town' => $addressInfo['wereda_town'] ?? CustomerContext::wereda(''),
            'kebele' => $addressInfo['kebele'] ?? CustomerContext::kebele(''),
            'house_no' => $addressInfo['house_no'] ?? CustomerContext::houseNo(''),
            'street_name' => $addressInfo['street_name'] ?? CustomerContext::streetName(''),
            'apartment' => $addressInfo['apartment'] ?? CustomerContext::apartment(''),
        ];
    }

    /**
     * Parse common BSS response envelope (RetCode, RetMsg, ResponseTime, CustomerSurveyOrderId).
     * Subclasses may use this and then persist; or implement full parse themselves.
     *
     * @throws ExternalServiceException If XML invalid or RetCode !== '0'
     */
    protected function parseHandleSurveyOrderResponse(array $data, string $xml): array
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

        $responseHeader = $responseMsg->children($namespaces['ser'])->ResponseHeader
            ?? $responseMsg->ResponseHeader;
        $responseHeaderData = $responseHeader->children($namespaces['com']);

        $responseBody = $responseMsg->children($namespaces['ser'])->HandleSurveyOrderRespBody
            ?? $responseMsg->HandleSurveyOrderRespBody;
        $responseBodyData = $responseBody->children($namespaces['com']);

        $retCode = (string) ($responseHeaderData->RetCode ?? '');
        $retMsg = (string) ($responseHeaderData->RetMsg ?? '');
        $responseTime = (string) ($responseHeaderData->ResponseTime ?? '');

        if ($retCode !== '0') {
            AppLogger::api()->warning('Manual survey order BSS returned error', [
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
                'customer_code' => $data['customer_code'] ?? null,
                'main_offer_id' => $this->mainOfferId(),
            ]);

            throw ExternalServiceException::errorResponse(
                'manual_survey',
                (int) $retCode,
                "BSS Error: {$retMsg}",
                $xml
            );
        }

        $customerSurveyOrderId = (string) ($responseBodyData->CustomerSurveyOrderId ?? '');

        return [
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => $responseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
        ];
    }

    /**
     * Persist local survey order record.
     */
    protected function persistSurvey(string $customerSurveyOrderId, array $data): SurveyOrder
    {
        $customerCode = $this->customerCode($data['customer_code'] ?? '');
        $primaryContact = $this->getPrimaryContact($data);

        $addressInfo = $data['survey_address_info'] ?? [];
        $zoneId = $data['zone_id'] ?? ($addressInfo['zone_id'] ?? null);
        $telecomRegionAreaId = $data['telecom_region'] ?? $this->fetchZoneCode($zoneId) ?? '104';

        $bandwidthKb = null;
        $mainOfferId = $this->mainOfferId();
        if ($mainOfferId !== OfferId::FixedVoice->value && !empty($data['bandwidth'])) {
            $bandwidthKb = $this->parseBandwidth($data['bandwidth']);
        }

        $areaCode = $addressInfo['area_code'] ?? null;
        $areaName = $addressInfo['area_name'] ?? null;

        $survey = SurveyOrder::create([
            'customer_code' => $customerCode,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'main_offer_id' => $this->mainOfferId(),
            'survey_type' => $data['survey_type'] ?? 'EIC08',
            'telecom_region' => $telecomRegionAreaId,
            'oper_type' => $data['oper_type'] ?? 'A',
            'customer_type' => 'residential',
            'bandwidth' => $bandwidthKb,
            'contact_person' => $primaryContact['contact_person'],
            'contact_no' => $primaryContact['contact_no'],
            'contact_email' => $primaryContact['contact_email'],
            'status' => FFDServiceProvisionStatus::Waiting->value,
            'survey_is_manual' => true,
            'with_device' => $data['with_device'] ?? null,
            'device_id' => $data['device_id'] ?? null,
            'device_voice_id' => null,
            'area_code' => $areaCode,
            'area_name' => $areaName,
            'media_type' => null,
            'cable_type' => null,
            'line_indicator' => null,
            'survey_failure_reason' => null,
        ]);

        $this->persistPayment($survey, $data);

        return $survey;
    }

    /**
     * Persist payment for manual survey order (no cable charge; includes device fee).
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

        $primaryNumber = $survey->voice_service_number ?? $survey->data_service_number ?? $data['service_number'] ?? $data['voice_service_number'] ?? $data['data_service_number'] ?? null;

        $profile = $this->getCustomerProfile();
        $requestData = [
            'service_number' => $primaryNumber,
            'voice_service_number' => $survey->voice_service_number,
            'data_service_number' => $survey->data_service_number,
            'offering_id' => $survey->main_offer_id,
            'network_type' => 4,
            'sub_type' => 0,
            'customer_type' => $profile['customer_type'],
            'customer_category' => $profile['customer_category'],
            'customer_subcategory' => $profile['customer_subcategory'],
            'customer_level' => $profile['customer_level'],
            'customer_nationality' => $profile['nationality'],
            'customer_id_type' => $profile['identification_type'],
        ];

        $fees = $this->paymentCalculator->calculateFeesWithoutCable($survey, $requestData);
        $deviceFee = $this->deviceFeeCalculator->calculate($survey);
        $totalAmount = $fees['total_amount'] + $deviceFee;

        $this->paymentService->createOrUpdatePayment([
            'customer_survey_order_id' => $survey->customer_survey_order_id,
            'service_number' => $primaryNumber,
            'subscription_fee' => $fees['subscription_fee'],
            'cable_charge' => 0,
            'device_fee' => $deviceFee,
            'total_amount' => $totalAmount,
        ]);
    }

    protected function generateTransactionId(): string
    {
        return now()->format('YmdHis') . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
    }

    protected function getCustomerEmail(?Customer $customer): ?string
    {
        if (!$customer) {
            return null;
        }
        $contact = $customer->contact;
        if (is_array($contact) && isset($contact['email'])) {
            return $contact['email'];
        }
        return null;
    }

    protected function fetchZoneCode(int|string|null $zoneId): ?string
    {
        $zoneId = $zoneId !== null ? (int) $zoneId : null;

        if (!$zoneId) {
            return null;
        }

        $zoneCode = app(ZoneService::class)->getZoneCodeById($zoneId);
        if ($zoneCode) {
            AppLogger::api()->info('Telecom region resolved from customer zone selection', [
                'zone_id' => $zoneId,
                'zone_code' => $zoneCode,
            ]);
            return $zoneCode;
        }

        AppLogger::api()->warning('Failed to resolve telecom region from zone_id', [
            'zone_id' => $zoneId,
        ]);

        return null;
    }

    public function find(string $customerSurveyOrderId): ?SurveyOrder
    {
        return SurveyOrder::where('customer_survey_order_id', $customerSurveyOrderId)->first();
    }
}
