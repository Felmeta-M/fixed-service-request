<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use phpseclib3\Crypt\PublicKeyLoader;
use RuntimeException;

class TelebirrSignerService
{
    protected string $privateKey;
    protected array $excludeFields;

    public function __construct()
    {
        $this->privateKey =  config('services.telebirr.private_key'); // file_get_contents(config('telebirr.private_key')); 
        $this->excludeFields = config('telebirr.exclude_fields');
    }

    public function sign(array $request): string
    {
        $string = $this->buildString($request);
        $sortedString = $this->sortedString($string);
        return $this->signWithRSA($sortedString);
    }

    public function buildString($request)
    {
        $sorted = collect($request)
            ->sortKeys()
            ->reject(fn($value, $key) => in_array($key, $this->excludeFields))
            ->flatMap(function ($value, $key) {
                if ($key === 'biz_content' && is_array($value)) {
                    return collect($value)->flatMap(function ($v, $k) {
                        if (is_array($v)) {
                            // Nested array like wallet_reference_data: flatten same as biz_content
                            return collect($v)->mapWithKeys(fn($innerV, $innerK) => [$innerK => $innerV]);
                        }
                        return [$k => $v];
                    });
                }

                return [$key => $value];
            });

        return $sorted
            ->map(fn($value, $key) => "{$key}={$value}")
            ->values()
            ->implode('&');
    }

    function sortedString($stringApplet)
    {
        return collect(explode('&', $stringApplet))
            ->sort()
            ->implode('&');
    }

    public function signWithRSA(string $data): ?string
    {
        try {
            $rsa = PublicKeyLoader::loadPrivateKey(file_get_contents(storage_path('app/keys/private.pem')));
            $signtureByte = $rsa->sign($data);

            return base64_encode($signtureByte);
        } catch (\Exception $e) {
            \Log::error('Error loading private key: ' . $e->getMessage());
            throw new \RuntimeException("Error loading private key.");
        }
    }
}
