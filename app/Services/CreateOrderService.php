<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Helpers\TelebirrHelper;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log as FacadesLog;
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

        $fabricToken = Cache::get('fabricToken');
        if (!$fabricToken) {
            $fabricToken = $tokenService->applyFabricToken();
            $expirationDate = Carbon::createFromFormat(
                'YmdHis',
                $fabricToken->expirationDate
            );
            Cache::put(
                'fabricToken',
                $fabricToken,
                $expirationDate
            );
        }
        // send query order
        // if ($this->isPaymentInitiated($data['customerSurveyOrderId'])) {
        //     $order = $this->requestQueryOrder($data);
        // }
        // 2️⃣ Send create order request
        $prepay_id = $this->requestCreateOrder($fabricToken->token, $data);

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
            ->withOptions([
                'verify' => false, // app()->isProduction()
            ])
            ->post($url, $payload); // convert JSON string to array

        if ($response->failed()) {
            Log::error("HTTP error: {$response->status()} with response: " . $response->body());
            throw new RuntimeException("Create order request failed.");
        }

        $object = $response->object();

        return $object->biz_content->prepay_id ?? null;
    }

    protected function requestQueryOrder($fabricToken, array $data)
    {
        $url = $this->baseUrl . '/payment/v1/merchant/queryOrder';

        $payload = self::createQueryObject($data);

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
            Log::error("HTTP error: {$response->status()} with response: " . $response->body());
            throw new RuntimeException("Create order request failed.");
        }

        $object = $response->object();
        Log::info($object);

        // return $object ?? null;
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

        return !empty($payment?->merch_order_id);
    }


    protected function createQueryObject(array $data): array
    {
        $merchantOrderId = TelebirrHelper::createMerchantOrderId();

        $payment = $this->paymentService->find($data['customerSurveyOrderId']);

        if ($payment->status === FFDServiceProvisionStatus::Paid) {
            throw new RuntimeException("Your payment has already been processed. No further action is needed.");
        } {

            // "timestamp": "1535166225",
            // "nonce_str": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
            // "method": "payment.queryorder",
            // "sign_type": "SHA256WithRSA",
            // "sign": "iq33P+PJk1A+aArrb9cFQk1zAXTJ8gp3+1fuonRETw26Hbjo1DLy7ANgQsp0DaFOnKCGLCDDTpIohH7kypuOcxjWrkjdyULNl2rIQEseTKugFp4UozwmXXO8Bfv/eEP//S0IEUlq7Y0wrUQU82g+A8JwvZPIU5furEadJx/Bj17Pbsjp4oeteS0fxORH80JUNeRKVhDRYl6bKyAX7V8mZRZhGDFLrdYc/rHiSg9+nVh5v5vmtzJ9v6zhVEJkLB8G5AG9KvD4Mf1PXmsszh40JIyft5X2Abc54cIDgfmX8cYIPA6fE6ftHJcAM+Gk74YehMIvQw3d75rZX/k17JdKZQ==",
            // "version": "1.0",
            // "biz_content": {
            //     "appid": "{{MerchantId}}",
            //     "merch_code": "{{MerchantCode}}",
            // 	"merch_order_id": "{{merch_order_id}}"
            // }
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
