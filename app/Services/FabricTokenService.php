<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class FabricTokenService
{
    protected string $baseUrl;
    protected string $fabricAppId;
    protected string $appSecret;
    protected string $merchantAppId;

    public function __construct()
    {
        $this->baseUrl       = config('services.telebirr.base_url');
        $this->fabricAppId   = config('services.telebirr.fabric_app_id');
        $this->appSecret     = config('services.telebirr.app_secret');
        $this->merchantAppId = config('services.telebirr.merchant_app_id');
    }

    /**
     * Apply for a Fabric token
     *
     * @return array
     * @throws RequestException
     */
    public function applyFabricToken(): string
    {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-APP-Key'    => $this->fabricAppId,
        ])
            ->timeout(30)
            ->withOptions([
                'verify' => false, // dev only
            ])
            ->post("{$this->baseUrl}/payment/v1/token", [
                'appSecret' => $this->appSecret,
            ]);

        if ($response->failed()) {
            logger()->error('Failed to get Fabric token: ' . $response['error']);
            throw new \RuntimeException("Telebirr API request to Fabric token endpoint failed.");
        }

        \Log::info($response);
        return $response->body();
    }
}
