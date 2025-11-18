<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use phpseclib3\Crypt\RSA;

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
    protected int    $expirationTime;
    protected string $algorithm;

    public function __construct()
    {
        try {
            $config = config('services.esignet');

            $this->clientId              = $config['client_id'];
            $this->redirectUri           = $config['redirect_uri'];
            $this->authorizationEndpoint = $config['authorization_endpoint'];
            $this->tokenEndpoint         = $config['token_endpoint'];
            $this->userinfoEndpoint      = $config['userinfo_endpoint'];
            $this->clientAssertionType   = $config['client_assertion_type'];
            $this->privateKeyJson        = $config['private_key'];
            $this->expirationTime        = $config['expiration_time'];
            $this->algorithm             = $config['algorithm'];
        } catch (\Throwable $e) {
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
        // Log::info("EsignetService::buildAuthorizationUrl - Generating PKCE");

        try {
            $codeVerifier = bin2hex(random_bytes(32));
            $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
            $state = bin2hex(random_bytes(16));

            // Log::info("PKCE generated", [
            //     'code_challenge' => $codeChallenge,
            //     'state' => $state
            // ]);

            $authUrl = $this->authorizationEndpoint . '?' . http_build_query([
                'response_type'         => 'code',
                'client_id'             => $this->clientId,
                'redirect_uri'          => $this->redirectUri,
                'scope'                 => 'openid profile email',
                'code_challenge'        => $codeChallenge,
                'code_challenge_method' => 'S256',
                'state'                 => $state,
            ]);

            return [
                'authUrl'      => $authUrl,
                'state'        => $state,
                'codeVerifier' => $codeVerifier,
            ];
        } catch (\Throwable $e) {
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
        // Log::info("EsignetService::exchangeCodeForToken - Starting token exchange");

        try {
            $clientAssertion = $this->generateClientAssertion();

            // Log::info("Client assertion successfully generated");
        } catch (\Throwable $e) {
            Log::error("Failed generating client assertion", [
                'error' => $e->getMessage()
            ]);

            return ['error' => 'Failed generating client assertion.'];
        }

        try {
            $response = Http::asForm()->post($this->tokenEndpoint, [
                'grant_type'            => 'authorization_code',
                'code'                  => $code,
                'redirect_uri'          => $this->redirectUri,
                'client_id'             => $this->clientId,
                'code_verifier'         => $codeVerifier,
                'client_assertion'      => $clientAssertion,
                'client_assertion_type' => $this->clientAssertionType,
            ]);

            // Log::info("Token endpoint response", [
            //     'status' => $response->status(),
            //     'body'   => $response->json()
            // ]);

            return $response->json();
        } catch (\Throwable $e) {
            Log::error("Error exchanging code for token", [
                "error" => $e->getMessage()
            ]);

            return [
                "error" => "Failed to exchange code for token."
            ];
        }
    }

    public function getUserInfo(string $accessToken)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$accessToken}",
                'Accept'        => '*/*',
            ])
                ->withOptions([
                    'verify' => app()->isProduction(),
                    'http_errors' => false, // don’t throw exceptions on 4xx/5xx
                ])
                ->get($this->userinfoEndpoint);

            $status = $response->status();
            $body = $response->body();

            // Log::info('EsignetService::getUserInfo - Status', ['status' => $status]);
            // Log::info('EsignetService::getUserInfo - Body', ['body' => $body]);

            if ($status !== 200 || empty($body)) {
                Log::error('Failed fetching user info', ['response' => ['status' => $status, 'body' => $body]]);
                throw new \Exception('Failed fetching user info');
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

            // Upsert based on phone_number
            $phone = substr($dataToInsert['phone_number'], -9) ?? null;
            if (!$phone) {
                throw new \Exception('Phone number missing');
            }
            $customer = DB::table('customers')->updateOrInsert(
                ['phone_number' => $phone],
                [
                    ...$dataToInsert,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            if ($customer) {
                return DB::table('customers')->where('phone_number', $phone)->first();;
            }
        } catch (\Exception $e) {
            Log::error('Exception fetching user info', ['error' => $e->getMessage()]);
            throw new \Exception('Exception fetching user info');
        }
    }

    public function decodeJwtPayload(string $jwt): array
    {
        try {
            $parts = explode('.', $jwt);
            if (count($parts) < 2) {
                throw new \Exception('Invalid JWT format');
            }

            $payload = $parts[1];
            // base64 decode, URL-safe
            $decoded = json_decode(
                base64_decode(strtr($payload, '-_', '+/')),
                true
            );

            return $decoded ?: [];
        } catch (\Exception $e) {
            Log::error('Failed decoding JWT', ['error' => $e->getMessage()]);
            return [];
        }
    }


    /**
     * Loads RSA Private Key (JWK)
     */
    protected function loadPrivateKey(): RSA
    {
        // Log::info("EsignetService::loadPrivateKey - Decoding JWK");

        try {
            $jwkJson = base64_decode($this->privateKeyJson);

            if (!$jwkJson) {
                throw new \Exception("Base64 decode failed — JWK is invalid");
            }

            // Log::info("JWK JSON decoded successfully");

            $key = RSA::loadPrivateKey($jwkJson, 'JWK')
                ->withPadding(RSA::SIGNATURE_PKCS1);

            // Log::info("RSA private key loaded successfully");

            return $key;
        } catch (\Throwable $e) {
            Log::error("Failed loading private key", [
                'error' => $e->getMessage()
            ]);
            throw $e; // keep throwing so generateClientAssertion can catch it
        }
    }


    /**
     * Generates JWT Client Assertion
     */
    protected function generateClientAssertion(): string
    {
        // Log::info("EsignetService::generateClientAssertion - Start");

        try {
            $privateKey = $this->loadPrivateKey();
        } catch (\Throwable $e) {
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

            // Log::info("JWT payload created", [
            //     'payload' => $payload
            // ]);

            $b64 = fn($data) => rtrim(strtr(base64_encode($data), '+/', '-_'), '=');

            $headerB64  = $b64(json_encode($header));
            $payloadB64 = $b64(json_encode($payload));

            $signature  = $privateKey->sign("$headerB64.$payloadB64");
            $sigB64     = $b64($signature);

            // Log::info("Client assertion successfully signed");

            return "$headerB64.$payloadB64.$sigB64";
        } catch (\Throwable $e) {
            Log::error("Failed generating client assertion", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
