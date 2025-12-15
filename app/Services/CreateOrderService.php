<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Helpers\TelebirrHelper;
use Illuminate\Support\Facades\Http;
use Log;
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
        // 1️⃣ Get Fabric token
        $tokenService = app(FabricTokenService::class);

        $fabricToken = $tokenService->applyFabricToken();

        // 2️⃣ Send create order request
        $prepay_id = $this->requestCreateOrder($fabricToken, $data);


        // 3️⃣ Build rawRequest string for H5 page
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
            ->withoutVerifying() // disables SSL verification (only for testing!)
            ->post($url, $payload); // convert JSON string to array

        if ($response->failed()) {
            Log::error("HTTP error: {$response->status()} with response: " . $response->body());
            throw new RuntimeException("Create order request failed.");
        }

        $object = $response->object();

        return $object->biz_content->prepay_id ?? null;
    }

    /**
     * Create request object for Fabric API
     */
    protected function createRequestObject(array $data): array
    {
        $merchantOrderId = TelebirrHelper::createMerchantOrderId();

        $payment = $this->paymentService->find($data['customerSurveyOrderId']);

        if ($payment->status === FFDServiceProvisionStatus::Paid->value) {
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
            'total_amount' => (string) $amount,
            'trans_currency' => 'ETB',
            'timeout_express' => '120m',
            'payee_identifier' => 'REDACTED_MERCHANT_CODE',
            'payee_identifier_type' => '04',
            'payee_type' => '5000',
            'redirect_url' => route('services')

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
