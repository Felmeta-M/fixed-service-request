<?php

namespace App\Services;

use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;
use RuntimeException;

class RsaSignatureService
{
    /**
     * Rebuild the data string to sign (key=value&key2=value2).
     */
    public function buildSignString(array $request): string
    {
        $exclude = ['sign', 'sign_type', 'header', 'refund_info', 'openType', 'raw_request'];
        $parts = [];

        foreach ($request as $key => $value) {
            if (in_array($key, $exclude, true)) {
                continue;
            }

            if ($key === 'biz_content' && is_array($value)) {
                foreach ($value as $k => $v) {
                    $parts[] = "{$k}={$v}";
                }
            } else {
                $parts[] = "{$key}={$value}";
            }
        }

        sort($parts);
        return implode('&', $parts);
    }

    /**
     * Sign data using RSA-PSS + SHA-256.
     */
    public function signWithRSA(string $data, string $privateKeyBase64): string
    {
        try {
            $keyBytes = base64_decode($privateKeyBase64, true);
            if ($keyBytes === false) {
                throw new RuntimeException('Invalid base64 private key');
            }

            $privateKey = PublicKeyLoader::load($keyBytes)
                ->withPadding(RSA::SIGNATURE_PSS)
                ->withHash('sha256');

            $signature = $privateKey->sign($data);

            return base64_encode($signature);
        } catch (\Throwable $e) {
            throw new RuntimeException('Signing failed: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Verify an RSA-PSS signature (for testing).
     */
    public function verifyWithRSA(string $data, string $signatureBase64, string $publicKeyBase64): bool
    {
        $keyBytes = base64_decode($publicKeyBase64, true);
        $publicKey = PublicKeyLoader::load($keyBytes)
            ->withPadding(RSA::SIGNATURE_PSS)
            ->withHash('sha256');

        $signature = base64_decode($signatureBase64, true);

        return $publicKey->verify($data, $signature);
    }
}
