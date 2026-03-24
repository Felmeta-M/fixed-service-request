<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Helpers\TelebirrHelper;
use App\Models\Payment;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateOrderService
{
    protected string $baseUrl;
    protected string $webBaseUrl;
    protected string $fabricAppId;
    protected string $merchantAppId;
    protected string $appSecret;
    protected string $merchantCode;
    protected string $notifyUrl;

    public function __construct(
        string $baseUrl,
        string $webBaseUrl,
        string $fabricAppId,
        string $appSecret,
        string $merchantAppId,
        string $merchantCode,
        protected readonly PaymentService $paymentService,
    ) {
        $this->baseUrl = $baseUrl;
        $this->webBaseUrl = $webBaseUrl;
        $this->fabricAppId = $fabricAppId;
        $this->appSecret = $appSecret;
        $this->merchantAppId = $merchantAppId;
        $this->merchantCode = $merchantCode;
        $this->notifyUrl = route('telebirr.notify');
    }

    /**
     * Get cached Fabric token or request a new one.
     */
    protected function getFabricToken(): string
    {
        $fabricToken = Cache::get('fabricToken');

        if (!$fabricToken) {
            $tokenService = app(FabricTokenService::class);
            $fabricToken = $tokenService->applyFabricToken();

            $expirationDate = Carbon::createFromFormat(
                'YmdHis',
                $fabricToken->expirationDate
            );

            Cache::put('fabricToken', $fabricToken, $expirationDate);
        }

        return is_object($fabricToken) ? $fabricToken->token : $fabricToken;
    }

    /**
     * Create an order and return the rawRequest string.
     *
     * BULLETPROOF DOUBLE PAYMENT PROTECTION:
     * 1. Check if payment is already paid in our DB → stop
     * 2. Use cache lock to prevent concurrent requests
     * 3. If payment was initiated before, query Telebirr for status
     * 4. If Telebirr says paid but our DB doesn't → confirm & stop
     * 5. Only then create a new payment intent
     *
     * @throws RuntimeException
     */
    public function createOrder(array $data): string
    {
        $orderId = $data['customerSurveyOrderId'];
        $lockKey = "payment_lock:{$orderId}";

        // 1️⃣ Acquire lock to prevent concurrent payment attempts (10 second window)
        $lock = Cache::lock($lockKey, 10);

        if (!$lock->get()) {
            AppLogger::payment()->warning('Payment request blocked - another request in progress', [
                'order_id' => $orderId,
            ]);
            throw new RuntimeException('A payment request is already being processed. Please wait a moment and try again.');
        }

        try {
            // 2️⃣ Check if payment already exists and is paid
            $payment = $this->paymentService->find($orderId);

            if ($payment->isPaid()) {
                AppLogger::payment()->warning('Double payment attempt blocked - already paid', [
                    'order_id' => $orderId,
                    'trans_id' => $payment->trans_id,
                ]);
                throw new RuntimeException('Your payment has already been processed. No further action is needed.');
            }

            // 3️⃣ Get Fabric token (cached)
            $fabricToken = $this->getFabricToken();

            // 4️⃣ If payment was previously initiated, verify status with Telebirr (at most every 5 minutes)
            $isPaymentInitiated = $this->isPaymentInitiated($orderId);
            if ($isPaymentInitiated) {
                AppLogger::payment()->info('Telebirr is payment initiated', [
                    'order_id' => $orderId,
                    'payment' => $payment,
                ]);

                $this->verifyAndReconcileTelebirrPayment($fabricToken, $payment);


                // Re-check after reconciliation (payment might have been confirmed)
                $payment->refresh();
                if ($payment->isPaid()) {
                    throw new RuntimeException('Your payment has already been processed. No further action is needed.');
                }
            }

            // 5️⃣ Create a NEW payment intent with Telebirr
            $prepay_id = $this->requestCreateOrder($fabricToken, $data);

            // 6️⃣ Build rawRequest string for H5 page
            $rawRequest = $this->createRawRequest($prepay_id);

            AppLogger::payment()->info('Telebirr raw request', [
                'rawRequest' => $rawRequest,
            ]);

            return $rawRequest;
        } finally {
            $lock->release();
        }
    }


    /**
     * Whether to run the Telebirr reconciliation check (throttled to once per 5 minutes per payment).
     */
    protected function shouldRunTelebirrReconciliationCheck(Payment $payment): bool
    {
        if ($payment->last_checked_at === null) {
            return true;
        }
        return $payment->last_checked_at->diffInMinutes(Carbon::now(), false) >= 5;
    }

    /**
     * Verify payment status with Telebirr and reconcile if paid externally.
     * This catches cases where customer paid but webhook failed.
     */
    protected function verifyAndReconcileTelebirrPayment(string $fabricToken, Payment $payment): void
    {
        $payment->update(['last_checked_at' => Carbon::now()]);

        try {
            $queryResult = $this->requestQueryOrder($fabricToken, $payment->merch_order_id);

            if (!$queryResult) {
                return;
            }

            /**
             * LOG ANALYSIS: 
             * Your log shows: "biz_content": {"order_status": "PAY_SUCCESS", "trans_id": "DBK10QO7WR"}
             * We must use object syntax (->) because requestQueryOrder returns $response->object()
             */
            $bizContent = $queryResult->biz_content ?? null;

            if (!$bizContent) {
                return;
            }

            // Telebirr uses 'order_status' and 'PAY_SUCCESS'
            $orderStatus = $bizContent->order_status ?? null;

            if ($orderStatus === 'PAY_SUCCESS') {
                AppLogger::payment()->info('Payment reconciliation triggered - Status: PAY_SUCCESS', [
                    'order_id' => $payment->customer_survey_order_id,
                    'merch_order_id' => $payment->merch_order_id,
                    'trans_id' => $bizContent->trans_id ?? null,
                ]);

                // Confirm the payment in our system
                $this->paymentService->confirmPayment($payment, [
                    'trade_status'     => 'Completed', // Keeping your internal 'Completed' status
                    'transId'          => $bizContent->trans_id ?? null,
                    'total_amount'     => $bizContent->total_amount ?? $payment->total_amount,
                    'payment_order_id' => $bizContent->payment_order_id ?? null,
                ]);
            } else {
                AppLogger::payment()->info('Reconciliation checked: Order not paid yet.', [
                    'status' => $orderStatus,
                    'merch_order_id' => $payment->merch_order_id
                ]);
            }
        } catch (\Throwable $e) {
            AppLogger::payment()->error('Critical Failure in verifyAndReconcileTelebirrPayment', [
                'order_id' => $payment->customer_survey_order_id,
                'merch_order_id' => $payment->merch_order_id,
                'error'    => $e->getMessage(),
                'file'     => $e->getFile(),
                'line'     => $e->getLine()
            ]);
        }
    }
    /**
     * Query order status from Telebirr using the existing merch_order_id.
     */
    protected function requestQueryOrder(string $fabricToken, string $merchOrderId): ?object
    {
        $url = $this->baseUrl . '/payment/v1/merchant/queryOrder';

        $payload = $this->buildQueryPayload($merchOrderId);

        $response = Http::logged('CreateOrderService', 'payment')
            ->withHeaders([
                'Content-Type' => 'application/json',
                'X-APP-Key' => $this->fabricAppId,
                'Authorization' => $fabricToken,
            ])
            ->withOptions([
                'verify' => false,
            ])
            ->post($url, $payload);

        if ($response->failed()) {
            AppLogger::payment()->warning('Telebirr query order request failed', [
                'status_code' => $response->status(),
                'response' => substr($response->body(), 0, 500),
                'merch_order_id' => $merchOrderId,
            ]);
            return null;
        }

        return $response->object();
    }

    /**
     * Send create order request
     */
    protected function requestCreateOrder($fabricToken, array $data)
    {
        $url = $this->baseUrl . '/payment/v1/merchant/preOrder';

        $payload = self::createRequestObject($data);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-APP-Key' => $this->fabricAppId,
            'Authorization' => $fabricToken,
        ])
            ->withOptions([
                'verify' => false, // app()->isProduction()
            ])
            ->post($url, $payload); // convert JSON string to array

        if ($response->failed()) {
            AppLogger::payment()->error('Telebirr create order request failed', [
                'status_code' => $response->status(),
                'response' => $response->body(),
                'order_id' => $data['customerSurveyOrderId'] ?? null,
            ]);
            throw new RuntimeException("Create order request failed.");
        }

        $object = $response->object();

        AppLogger::payment()->info('Telebirr order created successfully', [
            'prepay_id' => $object->biz_content->prepay_id ?? null,
            'order_id' => $data['customerSurveyOrderId'] ?? null,
        ]);

        return $object->biz_content->prepay_id ?? null;
    }



    /**
     * Build query payload for existing merch_order_id.
     */
    protected function buildQueryPayload(string $merchOrderId): array
    {
        $request = [
            'nonce_str' => (string) TelebirrHelper::createNonceStr(),
            'method' => 'payment.queryorder',
            'timestamp' => (string) TelebirrHelper::createTimeStamp(),
            'version' => '1.0',
            'biz_content' => [
                'appid' => $this->merchantAppId,
                'merch_code' => $this->merchantCode,
                'merch_order_id' => $merchOrderId,
            ],
            'sign_type' => 'SHA256WithRSA',
        ];

        $request['sign'] = app(TelebirrSignerService::class)->sign($request);

        return $request;
    }

    /**
     * Create request object for Fabric API
     */
    protected function createRequestObject(array $data): array
    {
        $merchantOrderId = TelebirrHelper::createMerchantOrderId();

        $payment = $this->paymentService->find($data['customerSurveyOrderId']);

        if ($payment->isPaid()) { // Payment status: Paid
            throw new RuntimeException("Your payment has already been processed. No further action is needed.");
        }

        $totalAmount = number_format((float) $payment->total_amount, 2, '.', '');

        $payment->update([
            'merch_order_id' => $merchantOrderId,
        ]);

        $request = [
            'nonce_str' => (string) TelebirrHelper::createNonceStr(),
            'method' => 'payment.preorder',
            'timestamp' => (string) TelebirrHelper::createTimeStamp(),
            'version' => '1.0',
            'biz_content' => [],
        ];


        $tradeType = $data['trade_type'] ?? 'Checkout';

        $biz = [
            'notify_url' => route('telebirr.notify'),
            'business_type' => 'BuyGoods',
            'trade_type' => $tradeType,
            'appid' => $this->merchantAppId,
            'merch_code' => $this->merchantCode,
            'merch_order_id' => (string) $merchantOrderId,
            'title' => (string) $data['customerSurveyOrderId'],
            'total_amount' => (string)$totalAmount,
            'trans_currency' => 'ETB',
            'timeout_express' => '120m',
            'payee_identifier' => $this->merchantCode,
            'payee_identifier_type' => '04',
            'payee_type' => '5000',
            'wallet_reference_data' => [
                'FBBID' => 'Et Online Fixed Service Provisioning'
            ],
            'redirect_url' => route('payment.success')

        ];

        $request['biz_content'] = $biz;
        $request['sign_type'] = 'SHA256WithRSA';

        $request['sign'] = app(TelebirrSignerService::class)->sign($request);

        return $request;
    }

    protected function isPaymentInitiated(string $customerSurveyOrderId): bool
    {
        $payment = $this->paymentService->find($customerSurveyOrderId);

        if (empty($payment)) {
            return false;
        }

        return !empty($payment?->merch_order_id);
    }



    /**
     * Build rawRequest string for H5 page
     */
    protected function createRawRequest(string $prepayId): string
    {
        $maps = [
            'appid' => $this->merchantAppId,
            'merch_code' => $this->merchantCode,
            'nonce_str' => (string) TelebirrHelper::createNonceStr(),
            'prepay_id' => $prepayId,
            'timestamp' => (string) TelebirrHelper::createTimeStamp(),
            'sign_type' => 'SHA256WithRSA',
        ];

        $rawRequest = '';
        foreach ($maps as $map => $m) {
            $rawRequest .= $map . '=' . $m . "&";
        }

        $sign = app(TelebirrSignerService::class)->sign($maps);

        $rawRequest = $rawRequest . 'sign=' . $sign;

        return trim((string) $rawRequest);
    }
}
