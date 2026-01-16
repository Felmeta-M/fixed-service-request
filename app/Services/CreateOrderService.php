<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Helpers\TelebirrHelper;
use App\Services\Logging\AppLogger;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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
     * Create an order and return the rawRequest string
     *
     * @param string $title
     * @param string $amount
     * @return string
     * @throws RuntimeException
     */
    public function createOrder(array $data): string
    {
        // 1️⃣ Get Fabric token (cached)
        $tokenService = app(FabricTokenService::class);

        $fabricToken = Cache::get('fabricToken');

        if (!$fabricToken) {
            $fabricToken = $tokenService->applyFabricToken();

            $expirationDate = Carbon::createFromFormat(
                'YmdHis',
                $fabricToken->expirationDate
            );

            Cache::put('fabricToken', $fabricToken, $expirationDate);
        }

        /**
         * 2️⃣ Manual query fallback (ONLY to detect completed payment)
         */
        // if ($this->isPaymentInitiated($data['customerSurveyOrderId'])) {

        //     $queryOrder = $this->requestQueryOrder($fabricToken->token, $data);
        //     Log::info($queryOrder);

        //     // Normalize provider response
        //     $queryOrder = is_object($queryOrder)
        //         ? (array) $queryOrder
        //         : ($queryOrder ?? []);

        //     // ✅ Payment already completed → confirm & STOP
        //     if (($queryOrder['trade_status'] ?? null) === 'Completed') {

        //         $payment = app(PaymentService::class)
        //             ->find($data['customerSurveyOrderId']);

        //         app(PaymentService::class)
        //             ->confirmPayment($payment, $queryOrder);

        //         throw new RuntimeException('Payment already completed.');
        //     }
        // }

        /**
         * 3️⃣ Always create a NEW payment intent
         */
        $prepay_id = $this->requestCreateOrder($fabricToken->token, $data);

        /**
         * 4️⃣ Build rawRequest string for H5 page
         */
        return $this->createRawRequest($prepay_id);
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

    protected function requestQueryOrder($fabricToken, array $data)
    {
        $url = $this->baseUrl . '/payment/v1/merchant/queryOrder';

        $payload = self::createQueryObject($data);

        $response = Http::logged('CreateOrderService', 'payment')
            ->withHeaders([
                'Content-Type' => 'application/json',
                'X-APP-Key' => $this->fabricAppId,
                'Authorization' => $fabricToken,
            ])
            ->withOptions([
                'verify' => false, // app()->isProduction()
            ])
            ->post($url, $payload); // convert JSON string to array

        if ($response->failed()) {
            AppLogger::payment()->error('Telebirr query order request failed', [
                'status_code' => $response->status(),
                'response' => $response->body(),
            ]);
            throw new RuntimeException("Create order request failed.");
        }

        AppLogger::payment()->debug('Telebirr query order response', [
            'response' => $response->json(),
        ]);

        $object = $response->object();
        return $object ?? null;
    }

    /**
     * Create request object for Fabric API
     */
    protected function createRequestObject(array $data): array
    {
        $merchantOrderId = TelebirrHelper::createMerchantOrderId();

        $payment = $this->paymentService->find($data['customerSurveyOrderId']);

        if ($payment->status === FFDServiceProvisionStatus::Paid) {
            throw new RuntimeException("Your payment has already been processed. No further action is needed.");
        }

        $amount = number_format((float) $payment->amount, 2, '.', '');

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

        $biz = [
            'notify_url' => route('telebirr.notify'),
            'business_type' => 'BuyGoods',
            'trade_type' => 'Checkout',
            'appid' => $this->merchantAppId,
            'merch_code' => $this->merchantCode,
            'merch_order_id' => (string) $merchantOrderId,
            'title' => (string) $data['customerSurveyOrderId'],
            'total_amount' => "1",
            'trans_currency' => 'ETB',
            'timeout_express' => '120m',
            'payee_identifier' => $this->merchantCode,
            'payee_identifier_type' => '04',
            'payee_type' => '5000',
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


    protected function createQueryObject(array $data): array
    {
        $merchantOrderId = TelebirrHelper::createMerchantOrderId();

        $payment = $this->paymentService->find($data['customerSurveyOrderId']);

        if ($payment->status === FFDServiceProvisionStatus::Paid) {
            throw new RuntimeException("Your payment has already been processed. No further action is needed.");
        }

        $request = [
            'nonce_str' => (string) TelebirrHelper::createNonceStr(),
            'method' => 'payment.queryorder',
            'timestamp' => (string) TelebirrHelper::createTimeStamp(),
            'version' => '1.0',
            'biz_content' => [],
        ];

        $biz = [
            'appid' => $this->merchantAppId,
            'merch_code' => $this->merchantCode,
            'merch_order_id' => (string) $merchantOrderId
        ];

        $request['biz_content'] = $biz;
        $request['sign_type'] = 'SHA256WithRSA';

        $request['sign'] = app(TelebirrSignerService::class)->sign($request);

        return $request;
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

        $rawRequest = $this->webBaseUrl . $rawRequest . "&version=1.0&trade_type=Checkout";

        return trim((string) $rawRequest);

        return $rawRequest;
    }
}
