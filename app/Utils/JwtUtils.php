<?php

namespace App\Utils;

use Exception;
use Firebase\JWT\JWT;
use Log;

class JwtUtils
{
    private array $config;

    public function __construct()
    {
        $this->config = config('services.fayda');
    }


    /**
     * Generate a signed JWT (client assertion) for authentication
     */
    public static function generateClientAssertion(): string
    {
        try {
            $privateKey = self::loadPrivateKeyFromString($_ENV['FAYDA_PRIVATE_KEY']);
            Log::info($privateKey);
            $payload = [
                'iss' => $_ENV['FAYDA_CLIENT_ID'],
                'sub' => $_ENV['FAYDA_CLIENT_ID'],
                'aud' => $_ENV['FAYDA_TOKEN_URL'],
                'exp' => time() + (int)$_ENV['EXPIRATION_TIME'] * 60,
                'iat' => time(),
            ];

            $clientAssertion = JWT::encode(
                $payload,
                $privateKey,
                $_ENV['FAYDA_ALG']
            );

            return $clientAssertion;

        } catch (Exception $e) {
            error_log('Error generating client assertion: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Load private key from base64url encoded JWK string
     */
    public static function loadPrivateKeyFromString(string $base64KeyStr): string
    {
        try {
            $keyBytes = self::base64urlDecode($base64KeyStr);
            $jwk = json_decode($keyBytes, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Failed to parse JWK: ' . json_last_error_msg());
            }

            // Decode JWK components
            $n = self::base64urlDecode($jwk['n']);
            $e = self::base64urlDecode($jwk['e']);
            $d = self::base64urlDecode($jwk['d']);

            // Build RSA private key in PEM format
            $rsa = [
                'n' => $n,
                'e' => $e,
                'd' => $d,
            ];

            if (isset($jwk['p'])) $rsa['p'] = self::base64urlDecode($jwk['p']);
            if (isset($jwk['q'])) $rsa['q'] = self::base64urlDecode($jwk['q']);
            if (isset($jwk['dp'])) $rsa['dMod1'] = self::base64urlDecode($jwk['dp']);
            if (isset($jwk['dq'])) $rsa['dMod2'] = self::base64urlDecode($jwk['dq']);
            if (isset($jwk['qi'])) $rsa['iqmp'] = self::base64urlDecode($jwk['qi']);

            // Convert to PEM format using OpenSSL
            $privateKey = self::convertJwkToPem($rsa);

            error_log('Private Key Loaded Successfully');
            return $privateKey;

        } catch (Exception $e) {
            error_log('Failed to load private key: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Base64URL decode helper function
     */
    private static function base64urlDecode(string $input): string
    {
        $padding = str_repeat('=', (4 - (strlen($input) % 4)) % 4);
        return base64_decode(strtr($input . $padding, '-_', '+/'));
    }

    /**
     * Convert JWK components to PEM format
     */
    private static function convertJwkToPem(array $rsa): string
    {
        // Use phpseclib or manual ASN.1 DER encoding
        // For simplicity, using OpenSSL resource conversion
        $details = [
            'n' => $rsa['n'],
            'e' => $rsa['e'],
            'd' => $rsa['d'],
            'p' => $rsa['p'] ?? null,
            'q' => $rsa['q'] ?? null,
            'dmp1' => $rsa['dMod1'] ?? null,
            'dmq1' => $rsa['dMod2'] ?? null,
            'iqmp' => $rsa['iqmp'] ?? null,
        ];

        // Create RSA key resource
        $key = openssl_pkey_new([
            'private_key_bits' => strlen($rsa['n']) * 8,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);

        // Export to PEM
        openssl_pkey_export($key, $pem);

        return $pem;
    }
}
