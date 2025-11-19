<?php

namespace App\Services;


use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use phpseclib3\Crypt\RSA;
use RuntimeException;
use Throwable;
use function Symfony\Component\Clock\now;

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

    public function __construct(
        protected QueryCustomerByServiceNumberService $queryCustomerByService
    )
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
            Log::error("EsignetService::__construct failed", [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Build Authorization URL with PKCE
     */
    public function buildAuthorizationUrl(): array
    {
        try {
            $codeVerifier = bin2hex(random_bytes(32));
            $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
            $state = bin2hex(random_bytes(16));

            $authUrl = $this->authorizationEndpoint . '?' . http_build_query([
                    'response_type' => 'code',
                    'client_id' => $this->clientId,
                    'redirect_uri' => $this->redirectUri,
                    'scope' => 'openid profile email',
                    'code_challenge' => $codeChallenge,
                    'code_challenge_method' => 'S256',
                    'state' => $state,
                ]);

            return [
                'authUrl' => $authUrl,
                'state' => $state,
                'codeVerifier' => $codeVerifier,
            ];
        } catch (Throwable $e) {
            Log::error("Error generating authorization URL", [
                "error" => $e->getMessage()
            ]);

            return [
                'error' => 'Failed to build authorization URL'
            ];
        }
    }


    /**
     * Exchange Code for Token
     */
    public function exchangeCodeForToken(string $code, string $codeVerifier): array
    {
        try {
            $clientAssertion = $this->generateClientAssertion();
        } catch (Throwable $e) {
            Log::error("Failed generating client assertion", [
                'error' => $e->getMessage()
            ]);

            return ['error' => 'Failed generating client assertion.'];
        }

        try {
            $response = Http::asForm()->post($this->tokenEndpoint, [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->redirectUri,
                'client_id' => $this->clientId,
                'code_verifier' => $codeVerifier,
                'client_assertion' => $clientAssertion,
                'client_assertion_type' => $this->clientAssertionType,
            ]);

            return $response->json();
        } catch (Throwable $e) {
            Log::error("Error exchanging code for token", [
                "error" => $e->getMessage()
            ]);

            return [
                "error" => "Failed to exchange code for token."
            ];
        }
    }

    /**
     * Generates JWT Client Assertion
     */
    protected function generateClientAssertion(): string
    {
        try {
            $privateKey = $this->loadPrivateKey();
        } catch (Throwable $e) {
            Log::error("loadPrivateKey failed inside generateClientAssertion", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }

        try {
            $header = [
                'alg' => $this->algorithm,
                'typ' => 'JWT'
            ];

            $now = time();

            $payload = [
                'iss' => $this->clientId,
                'sub' => $this->clientId,
                'aud' => $this->tokenEndpoint,
                'iat' => $now,
                'exp' => $now + ($this->expirationTime * 60),
                'jti' => bin2hex(random_bytes(16)),
            ];

            $b64 = fn($data) => rtrim(strtr(base64_encode($data), '+/', '-_'), '=');

            $headerB64 = $b64(json_encode($header));
            $payloadB64 = $b64(json_encode($payload));

            $signature = $privateKey->sign("$headerB64.$payloadB64");
            $sigB64 = $b64($signature);

            return "$headerB64.$payloadB64.$sigB64";
        } catch (Throwable $e) {
            Log::error("Failed generating client assertion", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Loads RSA Private Key (JWK)
     */
    protected function loadPrivateKey(): RSA
    {
        try {
            $jwkJson = base64_decode($this->privateKeyJson);

            if (!$jwkJson) {
                throw new Exception("Base64 decode failed — JWK is invalid");
            }

            $key = RSA::loadPrivateKey($jwkJson, 'JWK')
                ->withPadding(RSA::SIGNATURE_PKCS1);

            return $key;
        } catch (Throwable $e) {
            Log::error("Failed loading private key", [
                'error' => $e->getMessage()
            ]);
            throw $e; // keep throwing so generateClientAssertion can catch it
        }
    }

    public function getUserInfo(string $accessToken)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$accessToken}",
                'Accept' => '*/*',
            ])
                ->withOptions([
                    'verify' => app()->isProduction(),
                    'http_errors' => false,
                ])
                ->get($this->userinfoEndpoint);

            $status = $response->status();
            $body = $response->body();

            if ($status !== 200 || empty($body)) {
                Log::error('Failed fetching user info', ['response' => ['status' => $status, 'body' => $body]]);
                throw new Exception('Failed fetching user info');
            }

            $userInfo = $this->decodeJwtPayload($body);
            // Log::info('user inof', $userInfo);

            $allowedFields = [
                'sub',
                'name',
                'birthdate',
                'gender',
                'nationality',
                'phone_number',
                'address',
                'picture'
            ];

            $dataToInsert = array_intersect_key($userInfo, array_flip($allowedFields));

            $rawPhone = $dataToInsert['phone_number'] ?? null;
            $digits = preg_replace('/\D/', '', $rawPhone); // remove non-number
            $formattedPhone = substr($digits, -9);
            //TODO: check customer age, is_verified
            if ($this->isEthioTelecomCustomer($formattedPhone)) {
                $this->getCustomerOrFail($formattedPhone);
            }

            $dataToInsert['phone_number'] = $formattedPhone;

            $customer = DB::table('customers')->updateOrInsert(
                ['phone_number' => $formattedPhone],
                [
                    ...$dataToInsert,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            if ($customer) {
                return DB::table('customers')->where('phone_number', $formattedPhone)->first();
            }
        } catch (Exception $e) {
            Log::error('Exception fetching user info', ['error' => $e->getMessage()]);
            throw new Exception('Exception fetching user info');
        }
    }

    public function decodeJwtPayload(string $jwt): array
    {
        try {
            $parts = explode('.', $jwt);
            if (count($parts) < 2) {
                throw new Exception('Invalid JWT format');
            }

            $payload = $parts[1];
            // base64 decode, URL-safe
            $decoded = json_decode(
                base64_decode(strtr($payload, '-_', '+/')),
                true
            );

            return $decoded ?: [];
        } catch (Exception $e) {
            Log::error('Failed decoding JWT', ['error' => $e->getMessage()]);
            return [];
        }
    }

    function isEthioTelecomCustomer(string $digits): bool
    {
        $formattedPhone = substr($digits, -9);

        if (preg_match('/^9\d{8}$/', $formattedPhone) !== 1) {
            throw new RuntimeException("Phone number is not an Ethio Telecom customer.");
        }

        return true;
    }

    function getCustomerOrFail(string $formattedPhone)
    {
        $customer = $this->queryCustomerByService->getCustomer($formattedPhone);

        if ($customer === null) {
            throw new RuntimeException("Customer not found for phone: {$formattedPhone}");
        }

        return $customer;
    }

}
