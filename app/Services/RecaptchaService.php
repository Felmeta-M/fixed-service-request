<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Services\Logging\AppLogger;

class RecaptchaService
{
    /**
     * Cloudflare Turnstile verification endpoint
     */
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    /**
     * Secret key from environment
     */
    private ?string $secretKey;

    /**
     * Whether Turnstile is enabled
     */
    private bool $enabled;

    public function __construct()
    {
        $this->secretKey = config('services.turnstile.secret_key');
        $this->enabled = !empty($this->secretKey) && !empty(config('services.turnstile.site_key'));
    }

    /**
     * Check if Turnstile is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Verify a Turnstile token
     *
     * @param string $token The Turnstile response token from the client
     * @param string|null $remoteIp The user's IP address (optional)
     * @return array{success: bool, message: string}
     */
    public function verify(string $token, ?string $remoteIp = null): array
    {
        if (!$this->enabled) {
            if (app()->environment('local', 'development', 'testing')) {
                AppLogger::api()->warning('Turnstile verification skipped - not configured', [
                    'environment' => app()->environment(),
                ]);
                return [
                    'success' => true,
                    'message' => 'Turnstile verification skipped (not configured)',
                ];
            }
            return [
                'success' => false,
                'message' => 'Security verification is not properly configured',
            ];
        }

        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Security verification token is missing',
            ];
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post(self::VERIFY_URL, [
                    'secret' => $this->secretKey,
                    'response' => $token,
                    'remoteip' => $remoteIp,
                ]);

            if (!$response->successful()) {
                AppLogger::api()->error('Turnstile API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [
                    'success' => false,
                    'message' => 'Security verification service is unavailable',
                ];
            }

            $result = $response->json();

            if ($result['success'] ?? false) {
                return [
                    'success' => true,
                    'message' => 'Verification successful',
                ];
            }

            $errorCodes = $result['error-codes'] ?? [];
            $errorMessage = $this->getErrorMessage($errorCodes);

            return [
                'success' => false,
                'message' => $errorMessage,
            ];
        } catch (\Exception $e) {
            AppLogger::api()->error('Turnstile verification exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Security verification failed. Please try again.',
            ];
        }
    }

    /**
     * Get user-friendly error message from error codes
     */
    private function getErrorMessage(array $errorCodes): string
    {
        if (empty($errorCodes)) {
            return 'Security verification failed. Please try again.';
        }

        $errorMap = [
            'missing-input-secret' => 'Security verification configuration error',
            'invalid-input-secret' => 'Security verification configuration error',
            'missing-input-response' => 'Please complete the security verification',
            'invalid-input-response' => 'Security verification expired or invalid. Please try again.',
            'bad-request' => 'Security verification failed. Please try again.',
            'timeout-or-duplicate' => 'Security verification expired. Please refresh and try again.',
            'internal-error' => 'Security verification internal error. Please try again.',
        ];

        foreach ($errorCodes as $code) {
            if (isset($errorMap[$code])) {
                return $errorMap[$code];
            }
        }

        return 'Security verification failed. Please try again.';
    }
}
