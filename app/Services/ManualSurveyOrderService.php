<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Exceptions\ExternalServiceException;
use App\Models\Customer;
use App\Models\SurveyOrder;
use App\Models\TelecomRegion;
use App\Services\Logging\AppLogger;
use Illuminate\Http\JsonResponse;
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

    public function __construct()
    {
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
            AppLogger::api()->info('Manual survey order creation initiated', [
                'customer_code' => $data['customer_code'] ?? null,
                'survey_type' => $data['survey_type'] ?? null,
                'endpoint' => $this->endpoint(),
            ]);

            $xmlPayload = $this->buildRequestXml($data);

            AppLogger::api()->debug('Manual survey SOAP request built', [
                'customer_code' => $data['customer_code'] ?? null,
            ]);

            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedResponse = $this->parseResponseXml($data, $xmlResponse);

            AppLogger::api()->info('Manual survey order created successfully', [
                'customer_code' => $data['customer_code'] ?? null,
                'customer_survey_order_id' => $parsedResponse['customer_survey_order_id'] ?? null,
                'ret_code' => $parsedResponse['ret_code'] ?? null,
            ]);

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
        $processTime = $this->processTime() . '000';
        $completedDate = $this->completedDate();

        // Use shared customer context helpers
        $customerCode = $this->customerCode($data['customer_code'] ?? '');

        // Resolve telecom region: accept name and convert to area_id
        $telecomRegion = 104; // $this->resolveTelecomRegion($data['telecom_region'] ?? ''); //TODO: Add oper_type to the request
        $operType = $data['oper_type'] ?? 'A';

        // Convert bandwidth from MB to KB (BSS expects KB)
        $bandwidth = $this->parseBandwidth($data['bandwidth'] ?? '');

        // Use shared contact helpers
        $primaryContact = $this->getPrimaryContact($data);

        // Extract address info
        $addressInfo = $data['survey_address_info'] ?? [];
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
        $this->createLocalSurveyOrder($customerSurveyOrderId, $data);

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => $responseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
        ];
    }

    /**
     * Create a local survey order record.
     *
     * @param string $customerSurveyOrderId BSS survey order ID
     * @param array $data Survey order data
     * @return SurveyOrder
     */
    protected function createLocalSurveyOrder(string $customerSurveyOrderId, array $data): SurveyOrder
    {
        // Use shared customer context helpers
        $customerCode = $this->customerCode($data['customer_code'] ?? '');
        $primaryContact = $this->getPrimaryContact($data);

        // Resolve telecom region to area_id for storage
        $telecomRegionAreaId = $this->resolveTelecomRegion($data['telecom_region'] ?? null);

        return SurveyOrder::create([
            'customer_code' => $customerCode,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'main_offer_id' => $data['main_offer_id'],
            'survey_type' => $data['survey_type'],
            'telecom_region' => $telecomRegionAreaId,
            'oper_type' => $data['oper_type'] ?? 'A',
            'customer_type' => 'residential',
            'bandwidth' => $data['bandwidth'] ?? null,
            'contact_person' => $primaryContact['contact_person'],
            'contact_no' => $primaryContact['contact_no'],
            'contact_email' => $primaryContact['contact_email'],
            'status' => FFDServiceProvisionStatus::Pending->value,
            'survey_is_manual' => true,
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
     * Resolve telecom region from name to area_id.
     *
     * If the input is a numeric area_id, return it directly.
     * If the input is a name, query the telecom_regions table for the area_id.
     *
     * @param string|null $telecomRegion Region name or area_id
     * @return string The resolved area_id
     */
    protected function resolveTelecomRegion(?string $telecomRegion): string
    {
        // Default fallback
        $defaultAreaId = '104';

        if (empty($telecomRegion)) {
            return $defaultAreaId;
        }

        // If it's already a numeric area_id, return it directly
        if (is_numeric($telecomRegion)) {
            return $telecomRegion;
        }

        // Query by area name
        $areaId = TelecomRegion::getAreaIdByName($telecomRegion);

        if ($areaId) {
            AppLogger::api()->debug('Telecom region resolved', [
                'input' => $telecomRegion,
                'area_id' => $areaId,
            ]);
            return $areaId;
        }

        // Log warning if region name not found
        AppLogger::api()->warning('Telecom region not found, using default', [
            'input' => $telecomRegion,
            'default_area_id' => $defaultAreaId,
        ]);

        return $defaultAreaId;
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
