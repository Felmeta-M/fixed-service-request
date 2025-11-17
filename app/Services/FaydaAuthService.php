<?php

namespace App\Services;

use App\Utils\JwtUtils;
use Exception;
use Firebase\JWT\JWT;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FaydaAuthService
{
    protected JwtUtils $jwtUtils;
    private array $config;

    public function __construct(JwtUtils $jwtUtils)
    {
        $this->config = config('services.fayda');
        $this->jwtUtils = $jwtUtils;
    }

    /**
     * Generate a random state for CSRF protection
     */
    public function generateState(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Generate the authorization URL
     */
    public function authorizationUrl(string $state): string
    {
        return $this->config['auth_url'] . '?' . http_build_query([
                'client_id' => $this->config['client_id'],
                'redirect_uri' => $this->config['redirect_uri'],
                'response_type' => 'code',
                'scope' => 'openid profile',
                'state' => $state,
            ]);
    }

    /**
     * Exchange authorization code for access token
     */
    public function exchangeCode(string $code, string $codeVerifier): array
    {
        try {
//            $assertion = $this->createClientAssertion();
            $assertion = $this->jwtUtils->generateClientAssertion();
            $response = Http::post($this->config['token_url'], [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'client_id' => $this->config['client_id'],
                'redirect_uri' => $this->config['redirect_uri'],
                'code_verifier' => $codeVerifier,
                'client_assertion' => $assertion,
                'client_assertion_type' => $this->config['assertion_type'],
            ]);

            // If status >= 400, throw an exception
            $response->throw();

            // Log successful response (optional)
            Log::info('Token API Success', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $response->json();
        } catch (RequestException $e) {
            // Log detailed info for failed request
            $response = $e->response;
            Log::error('Token API Failed', [
                'status' => $response?->status(),
                'body' => $response?->body(),
                'message' => $e->getMessage(),
            ]);

            // Re-throw if you want the caller to handle it
            throw $e;
        } catch (Exception $e) {
            // Catch any other unexpected exceptions
            Log::error('Unexpected error during token request', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }

    }

    /**
     * Create client_assertion JWT using the RSA private key string
     */
    public function createClientAssertion(): string
    {
        try {
            $privateKey = $this->config['private_jwk']; // PEM private key string
            $now = time();

            $payload = [
                'iss' => $this->config['client_id'],
                'sub' => $this->config['client_id'],
                'aud' => $this->config['token_url'],
                'iat' => $now,
                'exp' => $now + 300,
            ];

            return JWT::encode($payload, $privateKey, 'RS256');
        } catch (Exception $e) {
            Log::error('Failed to create client assertion', [
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Fetch user info using access token
     */
    public function userInfo(string $accessToken): array
    {
        try {
            return Http::withToken($accessToken)
                ->get($this->config['userinfo_url'])
                ->throw()
                ->json();
        } catch (Exception $e) {
            Log::error('User info request failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Generate code verifier for PKCE
     */
    public function generateCodeVerifier(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    /**
     * Generate code challenge for PKCE
     */
    public function generateCodeChallenge(string $codeVerifier): string
    {
        return rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
    }
}
