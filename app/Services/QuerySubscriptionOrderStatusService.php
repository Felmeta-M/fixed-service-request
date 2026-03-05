<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use RuntimeException;

/**
 * Query Subscription Order Status Service
 *
 * Queries the BSS system to get the current status of a subscription order.
 * Used to track the progress of service provisioning orders (Data, Voice, Combo).
 */
class QuerySubscriptionOrderStatusService extends BaseApiService
{
    protected int $timeout = 15;
    /** @var int Requests per user per decay window (dashboard can trigger many status calls per page load) */
    protected int $rateLimit = 90;
    /** @var int 2 minutes - enough for a few page refreshes without blocking */
    protected int $decaySeconds = 120;

    /**
     * Per-user rate limit key so multiple users behind same proxy (e.g. 172.18.0.1) don't share one bucket.
     */
    protected function rateLimitKey(): string
    {
        $user = Auth::user();
        $identifier = $user
            ? ('user:' . ($user->customer_code ?? (string) $user->id))
            : (Request::ip() ?? 'guest');
        return "{$identifier}:{$this->endpoint()}";
    }

    protected function endpoint(): string
    {
        return config('services.order_query_status.endpoint');
    }

    /**
     * Query the status of a subscription order.
     *
     * @param string $orderId The subscription order ID to query
     * @param string|null $startTime Optional start time filter (YmdHis format)
     * @param string|null $endTime Optional end time filter (YmdHis format)
     * @return array Subscription order status result
     */
    public function queryStatus(string $orderId, ?string $startTime = null, ?string $endTime = null): array
    {
        try {
            // BSS restriction: interval between StartTime and EndTime must be < 1 month.
            // Default window is 7 days, but we also hard‑cap any caller‑supplied range to 30 days
            // to avoid vendor error "The interval between StartTime and EndTime cannot exceed one month".
            $end = $endTime ? \Carbon\Carbon::createFromFormat('YmdHis', $endTime) : now();
            $start = $startTime
                ? \Carbon\Carbon::createFromFormat('YmdHis', $startTime)
                : $end->copy()->subDays(7);

            // Ensure start is not after end.
            if ($start->gt($end)) {
                $start = $end->copy()->subDays(7);
            }

            // Clamp the interval to a maximum of 30 days to satisfy BSS constraint.
            $maxIntervalDays = 30;
            if ($end->diffInDays($start) > $maxIntervalDays) {
                $start = $end->copy()->subDays($maxIntervalDays);
            }

            $data = [
                'order_id' => $orderId,
                'start_time' => $start->format('YmdHis'),
                'end_time' => $end->format('YmdHis'),
            ];

            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $result = $this->parseResponse($xmlResponse, $orderId);

            return $result;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Query subscription order status failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Query status and return as API response.
     */
    public function query(string $orderId, ?string $startTime = null, ?string $endTime = null)
    {
        $result = $this->queryStatus($orderId, $startTime, $endTime);

        if (!$result['success']) {
            return ApiResponse::error($result['error'] ?? 'Query subscription order status failed', 500);
        }

        return ApiResponse::success($result);
    }

    /**
     * Get status label for vendor status code.
     * Uses FFDServiceProvisionStatus as single source of truth.
     */
    public static function getVendorStatusLabel(int $vendorStatusCode): string
    {
        try {
            $status = FFDServiceProvisionStatus::from($vendorStatusCode);
            return $status->label();
        } catch (\ValueError $e) {
            return 'Unknown';
        }
    }

    /**
     * Check if a subscription order is completed.
     */
    public function isCompleted(string $orderId): bool
    {
        $result = $this->queryStatus($orderId);
        $vendorStatus = $result['status'] ?? 0;
        return $vendorStatus === FFDServiceProvisionStatus::Completed->value;
    }

    /**
     * Check if a subscription order has failed.
     */
    public function isFailed(string $orderId): bool
    {
        $result = $this->queryStatus($orderId);
        $vendorStatus = $result['status'] ?? 0;
        return $vendorStatus === FFDServiceProvisionStatus::Failed->value;
    }

    /**
     * Check if a subscription order is cancelled.
     */
    public function isCancelled(string $orderId): bool
    {
        $result = $this->queryStatus($orderId);
        $vendorStatus = $result['status'] ?? 0;
        return $vendorStatus === FFDServiceProvisionStatus::Cancelled->value;
    }

    /**
     * Check if a subscription order is still processing.
     */
    public function isProcessing(string $orderId): bool
    {
        $result = $this->queryStatus($orderId);
        $vendorStatus = $result['status'] ?? 0;

        return in_array($vendorStatus, [
            FFDServiceProvisionStatus::Created->value,
            FFDServiceProvisionStatus::Ready->value,
            FFDServiceProvisionStatus::Processing->value,
            FFDServiceProvisionStatus::Waiting->value,
        ]);
    }

    /**
     * Build SOAP XML request for querying subscription order status.
     */
    protected function buildXml(array $data): string
    {
        $config = config('services.order_query_status');

        $transactionId = $this->transactionId();
        $reqTime = $this->processTime();

        $channel = $config['channel_id'];
        $partnerId = $config['tenant_id'];
        $accessUser = $config['access_user'];
        $accessPassword = $config['access_pwd'];
        $businessCode = 'ChangeSupplementaryOffering';

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ord="http://www.huawei.com/bss/soaif/interface/OrderService/"
    xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <ord:QueryOrderStatusReqMsg>
            <com:ReqHeader>
                <com:Version>1</com:Version>
                <com:BusinessCode>{$businessCode}</com:BusinessCode>
                <com:TransactionId>{$transactionId}</com:TransactionId>
                <com:Channel>{$channel}</com:Channel>
                <com:PartnerId>{$partnerId}</com:PartnerId>
                <com:ReqTime>{$reqTime}</com:ReqTime>
                <com:AccessUser>{$accessUser}</com:AccessUser>
                <com:AccessPassword>{$accessPassword}</com:AccessPassword>
            </com:ReqHeader>
            <ord:QueryOrder>
                <com:OrderId>{$data['order_id']}</com:OrderId>
                <com:StartTime>{$data['start_time']}</com:StartTime>
                <com:EndTime>{$data['end_time']}</com:EndTime>
            </ord:QueryOrder>
        </ord:QueryOrderStatusReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response.
     */
    protected function parseResponse(string $xml, string $orderId): array
    {
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            AppLogger::api()->error('Failed to parse subscription order status XML response', [
                'order_id' => $orderId,
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
        $ordNs = $namespaces['ord'] ?? 'http://www.huawei.com/bss/soaif/interface/OrderService/';
        $comNs = $namespaces['com'] ?? 'http://www.huawei.com/bss/soaif/interface/common/';

        $body = $parsed->children($soapNs)->Body;
        $responseMsg = $body->children($ordNs)->QueryOrderStatusRspMsg;

        if (!$responseMsg) {
            AppLogger::api()->error('Missing QueryOrderStatusRspMsg in response', [
                'order_id' => $orderId,
            ]);

            return [
                'success' => false,
                'error' => 'Invalid response structure',
            ];
        }

        // Parse response header
        $header = $responseMsg->children($ordNs)->ResponseHeader ?? $responseMsg->ResponseHeader;
        $headerData = $header->children($comNs);

        $returnCode = (string) ($headerData->ReturnCode ?? '');
        $returnMsg = (string) ($headerData->ReturnMsg ?? '');
        $rspTime = (string) ($headerData->RspTime ?? '');

        // Check for success (0000 = success)
        if ($returnCode !== '0000' && $returnCode !== '0') {
            AppLogger::api()->error('Query subscription order status API returned error', [
                'order_id' => $orderId,
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

        // Parse subscription order status
        $queryOrderStatus = $responseMsg->children($ordNs)->QueryOrderStatus ?? $responseMsg->QueryOrderStatus;
        $statusData = $queryOrderStatus->children($comNs);

        $responseOrderId = (string) ($statusData->OrderId ?? '');
        $vendorStatusCode = (int) ($statusData->Status ?? 0);

        // Return vendor status code as-is (these are vendor-specific statuses)
        return [
            'success' => true,
            'return_code' => $returnCode,
            'return_msg' => $returnMsg,
            'response_time' => $rspTime,
            'order_id' => $responseOrderId,
            'status' => $vendorStatusCode, // Vendor status code (1-8)
            'status_label' => self::getVendorStatusLabel($vendorStatusCode),
        ];
    }
}
