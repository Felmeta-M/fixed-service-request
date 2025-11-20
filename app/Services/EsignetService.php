<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use phpseclib3\Crypt\RSA;
use Throwable;

class EsignetService
{
    protected string $clientId;
    protected string $redirectUri;
    protected string $authorizationEndpoint;
    protected string $tokenEndpoint;
    protected string $userinfoEndpoint;
    protected string $clientAssertionType;
    protected string $privateKeyJson;
    protected int $expirationTime;
    protected string $algorithm;

    public function __construct()
    {
        try {
            $config = config('services.esignet');

            foreach ($config as $key => $value) {
                $property = Str::camel($key);
                if (property_exists($this, $property)) {
                    $this->{$property} = $value;
                }
            }

        } catch (Throwable $e) {
            Log::error('EsignetService::__construct failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /** Build ESIGNET Authentication URL */
    public function buildAuthorizationUrl(): array
    {
        try {
            $verifier = bin2hex(random_bytes(32));
            $challenge = rtrim(strtr(
                base64_encode(hash('sha256', $verifier, true)),
                '+/', '-_'
            ), '=');

            $state = bin2hex(random_bytes(16));

            return [
                'status' => 'ok',
                'auth_url' => $this->authorizationEndpoint . '?' . http_build_query([
                        'response_type' => 'code',
                        'client_id' => $this->clientId,
                        'redirect_uri' => $this->redirectUri,
                        'scope' => 'openid profile email',
                        'code_challenge' => $challenge,
                        'code_challenge_method' => 'S256',
                        'state' => $state,
                    ]),
                'code_verifier' => $verifier,
                'state' => $state,
            ];

        } catch (Throwable $e) {
            Log::error('Error building authorization URL', ['error' => $e->getMessage()]);

            return [
                'status' => 'error',
                'message' => 'Unable to build authorization URL.',
            ];
        }
    }

    /** Exchange code for token */
    public function exchangeCodeForToken(string $code, string $verifier): array
    {
        try {
            $assertion = $this->generateClientAssertion();
        } catch (Throwable) {
            return ['status' => 'error', 'message' => 'Client assertion generation failed.'];
        }

        try {
            $response = Http::asForm()->post($this->tokenEndpoint, [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->redirectUri,
                'client_id' => $this->clientId,
                'code_verifier' => $verifier,
                'client_assertion' => $assertion,
                'client_assertion_type' => $this->clientAssertionType,
            ]);

            $json = $response->json();

            if (!isset($json['access_token'])) {
                return ['status' => 'error', 'message' => 'Token exchange failed.', 'details' => $json];
            }

            return ['status' => 'ok', 'token' => $json];

        } catch (Throwable $e) {
            Log::error('Error exchanging token', ['error' => $e->getMessage()]);
            return ['status' => 'error', 'message' => 'Token request failed.'];
        }
    }

    /** Client Assertion */
    protected function generateClientAssertion(): string
    {
        $key = $this->loadPrivateKey();

        $now = time();

        $header = ['alg' => $this->algorithm, 'typ' => 'JWT'];
        $payload = [
            'iss' => $this->clientId,
            'sub' => $this->clientId,
            'aud' => $this->tokenEndpoint,
            'iat' => $now,
            'exp' => $now + ($this->expirationTime * 60),
            'jti' => bin2hex(random_bytes(16)),
        ];

        $b64 = fn($d) => rtrim(strtr(base64_encode($d), '+/', '-_'), '=');

        $h = $b64(json_encode($header));
        $p = $b64(json_encode($payload));

        return "{$h}.{$p}." . $b64($key->sign("$h.$p"));
    }

    /** Load JWK Private Key */
    protected function loadPrivateKey(): RSA
    {
        $json = base64_decode($this->privateKeyJson);
        return RSA::loadPrivateKey($json, 'JWK')->withPadding(RSA::SIGNATURE_PKCS1);
    }

    /** Get User Info */
    public function getUserInfo(string $accessToken): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$accessToken}",
            ])->get($this->userinfoEndpoint);

            if ($response->status() !== 200) {
                return ['status' => 'error', 'message' => 'Failed to fetch user info'];
            }

            $payload = $this->decodeJwtPayload($response->body());
            if (empty($payload)) {
                return ['status' => 'error', 'message' => 'Invalid user info payload'];
            }

            // Extract phone number
            $raw = $payload['phone_number'] ?? null;
            $digits = preg_replace('/\D/', '', $raw);
            $phone = substr($digits, -9);

            if (!$phone) {
                return ['status' => 'error', 'message' => 'User phone number missing'];
            }

            return [
                'status' => 'ok',
                'phone' => $phone, // normalized ET format
            ];

        } catch (Throwable $e) {
            Log::error('Exception fetching user info', ['error' => $e->getMessage()]);
            return ['status' => 'error', 'message' => 'Error fetching user info'];
        }
    }

    /** Decode JWT payload */
    public function decodeJwtPayload(string $jwt): array
    {
        try {
            $parts = explode('.', $jwt);
            return json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true) ?? [];
        } catch (Exception $e) {
            return [];
        }
    }
}
