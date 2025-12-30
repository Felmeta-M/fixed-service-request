<?php

namespace App\Services;

use App\Models\Customer;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use phpseclib3\Crypt\RSA;
use RuntimeException;
use Throwable;

class EsignetService
{
    protected string $clientId;
    protected string $redirectUri;
    protected string $authorizationEndpoint;
    protected string $tokenEndpoint;
    protected string $userinfoEndpoint;
    protected string $clientAssertionType;
    protected string $privateKey;
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
            // Generate PKCE verifier & challenge
            $verifier = bin2hex(random_bytes(32));
            $challenge = rtrim(strtr(
                base64_encode(hash('sha256', $verifier, true)),
                '+/',
                '-_'
            ), '=');

            // Generate state
            $state = bin2hex(random_bytes(16));

            // Define mandatory claims (disable user selection)
            $claims = [
                'userinfo' => [
                    'name' => ['essential' => true],
                    'phone_number' => ['essential' => true],
                    'email' => ['essential' => true],
                    'picture' => ['essential' => true],
                    'gender' => ['essential' => true],
                    'birthdate' => ['essential' => true],
                    'address' => ['essential' => true],
                    'nationality' => ['essential' => true],
                ],
                'id_token' => [
                    'sub' => ['essential' => true],
                ],
            ];

            // IMPORTANT: Encode claims only once (JSON only)
            $encodedClaims = json_encode($claims, JSON_UNESCAPED_SLASHES);
            $acrValues = 'mosip:idp:acr:generated-code';

            // Build authorization URL
            $authUrl = $this->authorizationEndpoint . '?' . http_build_query([
                'response_type' => 'code',
                'client_id' => $this->clientId,
                'redirect_uri' => $this->redirectUri,
                'scope' => 'openid profile email',
                'code_challenge' => $challenge,
                'code_challenge_method' => 'S256',
                'state' => $state,
                'claims' => $encodedClaims,
                'acr_values' => $acrValues,
            ]);

            return [
                'status' => 'ok',
                'auth_url' => $authUrl,
                'code_verifier' => $verifier,
                'state' => $state,
            ];
        } catch (Throwable $e) {
            Log::error('Error building authorization URL', [
                'error' => $e->getMessage(),
            ]);

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

    protected function loadPrivateKey(): RSA
    {
        try {
            // Step 1. base64 decode
            $decoded = base64_decode($this->privateKey, true);

            if ($decoded === false) {
                logger()->error('Private key base64 decode failed');
                throw new RuntimeException('Private key base64 decode failed');
            }

            // Step 2. try load RSA key from JWK
            return RSA::loadPrivateKey($decoded, 'JWK')->withPadding(RSA::SIGNATURE_PKCS1);
        } catch (Throwable $e) {
            logger()->error('Failed to load private key', [
                'exception' => $e->getMessage(),
                'type' => get_class($e),
                // never log the full key!
                'key_length' => strlen($this->privateKey ?? '')
            ]);
            throw new RuntimeException('Unable to load private key. Please check configuration.');
        }
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
                return [
                    'status' => 'error',
                    'message' => 'User phone number missing',
                ];
            }

            $result = $this->createOrUpdateCustomerBySub($payload);

            if ($result['status'] !== 'ok') {
                return [
                    'status' => 'error',
                    'message' => 'Failed to process your account. Please try again.'
                ];
            }

            $customer = $result['customer'];

            return [
                'status' => 'ok',
                'customer' => $customer,
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

    public function createOrUpdateCustomerBySub(array $payload)
    {
        try {
            $sub = $payload['sub'] ?? null;
            if (!$sub) {
                logger()->error('Missing sub in payload');
                throw new Exception('Invalid user payload (missing sub).');
            }
            $name = $payload['name'] ?? null;
            $phoneNumber = $payload['phone_number'] ?? null;
            $gender = $payload['gender'] ?? null;
            $nationality = $payload['nationality'] ?? null;
            $identification_type = 2; //national id
            $identification_number = $payload['sub'] ?? null;
            $picture = $payload['picture'] ?? null;
            $birthdate = null;
            if (!empty($payload['birthdate'])) {
                $birthdate = date('Y-m-d', strtotime(str_replace('/', '-', $payload['birthdate'])));
            }
            $address = $payload['address'] ?? null;
            $customer = Customer::where('sub', $sub)->first();
            if ($customer) {
                // logger()->info('Customer found, updating', ['sub' => $sub]);
            } else {
                // logger()->info('Customer not found, creating new', ['sub' => $sub]);
                $customer = new Customer();
                $customer->sub = $sub;
                $customer->name = $name;
                $customer->phone_number = substr($phoneNumber, -9);
                $customer->gender = $gender;
                $customer->nationality = $nationality;
                $customer->identification_type = $identification_type;
                $customer->identification_number = $identification_number;
                $customer->birthdate = $birthdate;
                $customer->picture = $picture;
                $customer->address = $address ? json_encode($address) : null;
                $customer->save();
                $customer->refresh();
            }

            return [
                'status' => 'ok',
                'customer' => $customer
            ];
        } catch (Throwable $e) {
            logger()->error('Customer sync failed', [
                'exception' => $e->getMessage(),
                'payload' => $payload
            ]);

            return [
                'status' => 'error',
                'message' => 'Failed to sync customer.',
            ];
        }
    }
}
