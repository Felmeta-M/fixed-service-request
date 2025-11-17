<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use phpseclib3\Crypt\RSA;

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
    }

    /**
     * Build Authorization URL with PKCE
     */
    public function buildAuthorizationUrl(): array
    {
        $codeVerifier = bin2hex(random_bytes(32));
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
        $state = bin2hex(random_bytes(16));

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
    }


    /**
     * Exchange Authorization Code for Access Token using PKCE
     */
    public function exchangeCodeForToken(string $code, string $codeVerifier): array
    {
        $clientAssertion = $this->generateClientAssertion();

        $response = Http::asForm()->post($this->tokenEndpoint, [
            'grant_type'            => 'authorization_code',
            'code'                  => $code,
            'redirect_uri'          => $this->redirectUri,
            'client_id'             => $this->clientId,
            'code_verifier'         => $codeVerifier,
            'client_assertion'      => $clientAssertion,
            'client_assertion_type' => $this->clientAssertionType,
        ]);

        return $response->json();
    }

    /**
     * Get User Info from Access Token
     */
    public function getUserInfo(string $accessToken): array
    {
        return Http::withToken($accessToken)
            ->get($this->userinfoEndpoint)
            ->json();
    }

    /**
     * Generate JWT client_assertion
     */
    protected function generateClientAssertion(): string
    {
        $privateKey = $this->loadPrivateKey(); // now handles base64 JWK JSON

        $header = ['alg' => $this->algorithm, 'typ' => 'JWT'];
        $now = time();
        $payload = [
            'iss' => $this->clientId,
            'sub' => $this->clientId,
            'aud' => $this->tokenEndpoint,
            'iat' => $now,
            'exp' => $now + ($this->expirationTime * 60),
            'jti' => bin2hex(random_bytes(16)),
        ];

        $headerB64  = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
        $payloadB64 = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
        $sigB64     = rtrim(strtr(base64_encode($privateKey->sign($headerB64 . '.' . $payloadB64)), '+/', '-_'), '=');

        return "{$headerB64}.{$payloadB64}.{$sigB64}";
    }



    protected function loadPrivateKey(): RSA
    {
        // Decode base64 JSON from .env
        $jwkJson = base64_decode($this->privateKeyJson); // $this->privateKeyPem still holds base64 string
        $jwkData = json_decode($jwkJson, true);

        if (!$jwkData || !isset($jwkData['n'], $jwkData['e'], $jwkData['d'])) {
            throw new \Exception("Invalid private key format: not a valid JWK JSON");
        }

        // Convert base64url values to binary
        $base64urlDecode = fn($val) => base64_decode(strtr($val, '-_', '+/'));

        $rsaKeyArray = [
            'n'  => $base64urlDecode($jwkData['n']),
            'e'  => $base64urlDecode($jwkData['e']),
            'd'  => $base64urlDecode($jwkData['d']),
            'p'  => isset($jwkData['p']) ? $base64urlDecode($jwkData['p']) : null,
            'q'  => isset($jwkData['q']) ? $base64urlDecode($jwkData['q']) : null,
            'dp' => isset($jwkData['dp']) ? $base64urlDecode($jwkData['dp']) : null,
            'dq' => isset($jwkData['dq']) ? $base64urlDecode($jwkData['dq']) : null,
            'qi' => isset($jwkData['qi']) ? $base64urlDecode($jwkData['qi']) : null,
        ];

        return RSA::loadPrivateKey($rsaKeyArray)->withPadding(RSA::SIGNATURE_PKCS1);
    }
}
