<?php

namespace App\Services;


use App\Helpers\TelebirrHelper;
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
        string $merchantCode
    ) {
        $this->baseUrl       = $baseUrl;
        $this->webBaseUrl       = $webBaseUrl;
        $this->fabricAppId   = $fabricAppId;
        $this->appSecret     = $appSecret;
        $this->merchantAppId = $merchantAppId;
        $this->merchantCode  = $merchantCode;
        $this->notifyUrl = route('payment.notify');
    }

    /**
     * Create an order and return the rawRequest string
     *
     * @param string $title
     * @param string $amount
     * @return string
     * @throws RuntimeException
     */
    public function createOrder(string $title, string $amount): string
    {
        // 1️⃣ Get Fabric token
        $tokenService = app(FabricTokenService::class);
        $fabricToken = (string) $tokenService->applyFabricToken();
        logger()->info('Fabric token obtained', [$fabricToken]);
        // 2️⃣ Send create order request
        $createOrderResponse = $this->requestCreateOrder($fabricToken, $title, $amount);
        $responseData = json_decode($createOrderResponse);
        if (!isset($responseData->biz_content->prepay_id)) {
            throw new RuntimeException('Prepay ID not returned from Fabric API.');
        }

        $prepayId = $responseData->biz_content->prepay_id;

        // 3️⃣ Build rawRequest string for H5 page
        return $this->createRawRequest($prepayId);
    }

    /**
     * Send create order request
     */
    protected function requestCreateOrder(string $fabricToken, string $title, string $amount)
    {
        $data = $this->createRequestObject($title, $amount);
        $ch = curl_init("{$this->baseUrl}/payment/v1/merchant/preOrder");

        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "X-APP-Key: {$this->fabricAppId}",
            "Authorization: {$fabricToken}"
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // dev only

        $response = curl_exec($ch);
        curl_close($ch);

        \Log::info($response);
        return $response;
        // $response = Http::withHeaders([
        //     'Content-Type'  => 'application/json',
        //     'X-APP-Key'     => $this->fabricAppId,
        //     'Authorization' => $fabricToken,
        // ])
        //     ->timeout(10)
        //     ->withOptions([
        //         'verify' => false, // dev only
        //     ])
        //     ->post("{$this->baseUrl}/payment/v1/merchant/preOrder", $data);

        // if ($response->failed()) {
        //     logger()->error('Create order failed', [
        //         'status' => $response->status(),
        //         'body'   => $response->body(),
        //     ]);
        //     throw new RuntimeException('Create order request failed.');
        // }
        // return $response->body();
    }

    /**
     * Create request object for Fabric API
     */
    protected function createRequestObject(string $title, string $amount)
    {
        $bizContent = [
            'notify_url'           => $this->notifyUrl,
            'business_type'        => 'BuyGoods',
            'trade_type'           => 'Checkout',
            'appid'                => $this->merchantAppId,
            'merch_code'           => $this->merchantCode,
            'merch_order_id'       => TelebirrHelper::createMerchantOrderId(), // unique order id
            'title'                => $title,
            'total_amount'         => $amount,
            'trans_currency'       => 'ETB',
            'timeout_express'      => '120m',
            'payee_identifier'     => '220311',
            'payee_identifier_type' => '04',
            'payee_type'           => '5000',
        ];

        $request = [
            'nonce_str'   => TelebirrHelper::createNonceStr(),
            'method'      => 'payment.preorder',
            'timestamp'   => TelebirrHelper::createTimeStamp(),
            'version'     => '1.0',
            'biz_content' => $bizContent,
            'sign_type'   => 'SHA256withRSA',
        ];

        // Sign the request
        $request['sign'] = app(TelebirrSignerService::class)->sign($request);

        return json_encode($request);
    }

    /**
     * Build rawRequest string for H5 page
     */
    protected function createRawRequest(string $prepayId): string
    {
        $maps = [
            'appid'      => $this->merchantAppId,
            'merch_code' => $this->merchantCode,
            'nonce_str'  => TelebirrHelper::createNonceStr(),
            'prepay_id'  => $prepayId,
            'timestamp'  => TelebirrHelper::createTimeStamp(),
            'sign_type'  => 'SHA256WithRSA',
        ];

        $rawRequest = '';
        foreach ($maps as $key => $value) {
            $rawRequest .= $key . '=' . $value . '&';
        }

        $rawRequest .= 'sign=' . app(TelebirrSignerService::class)->sign($maps);

        return "{$this->webBaseUrl}{$rawRequest}&version=1.0&trade_type=Checkout";
    }
}
