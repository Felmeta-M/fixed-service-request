<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Services\Logging\AppLogger;

class RecaptchaService
{
    /**
     * Google reCAPTCHA verification endpoint
     */
    private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

    /**
     * Minimum score threshold for reCAPTCHA v3 (not used for v2)
     */
    private const MIN_SCORE = 0.5;

    /**
     * Secret key from environment
     */
    private ?string $secretKey;

    /**
     * Whether reCAPTCHA is enabled
     */
    private bool $enabled;

    public function __construct()
    {
        $this->secretKey = config('services.recaptcha.secret_key');
        $this->enabled = !empty($this->secretKey) && !empty(config('services.recaptcha.site_key'));
    }

    /**
     * Check if reCAPTCHA is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Verify a reCAPTCHA token
     *
     * @param string $token The reCAPTCHA response token from the client
     * @param string|null $remoteIp The user's IP address (optional, improves verification)
     * @return array{success: bool, message: string, score?: float}
     */
    public function verify(string $token, ?string $remoteIp = null): array
    {
        // If reCAPTCHA is not configured, skip verification in development
        if (!$this->enabled) {
            if (app()->environment('local', 'development', 'testing')) {
                AppLogger::api()->warning('reCAPTCHA verification skipped - not configured', [
                    'environment' => app()->environment(),
                ]);
                return [
                    'success' => true,
                    'message' => 'reCAPTCHA verification skipped (not configured)',
                ];
            }

            // In production, fail if not configured
            return [
                'success' => false,
                'message' => 'Security verification is not properly configured',
            ];
        }

        // Validate token is not empty
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
                AppLogger::api()->error('reCAPTCHA API request failed', [
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
                // For reCAPTCHA v3, also check the score
                if (isset($result['score'])) {
                    if ($result['score'] < self::MIN_SCORE) {
                        return [
                            'success' => false,
                            'message' => 'Security verification failed. Please try again.',
                            'score' => $result['score'],
                        ];
                    }
                    return [
                        'success' => true,
                        'message' => 'Verification successful',
                        'score' => $result['score'],
                    ];
                }

                // reCAPTCHA v2 success
                return [
                    'success' => true,
                    'message' => 'Verification successful',
                ];
            }

            // Handle specific error codes
            $errorCodes = $result['error-codes'] ?? [];
            $errorMessage = $this->getErrorMessage($errorCodes);

            return [
                'success' => false,
                'message' => $errorMessage,
            ];
        } catch (\Exception $e) {
            AppLogger::api()->error('reCAPTCHA verification exception', [
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

        // Map error codes to user-friendly messages
        $errorMap = [
            'missing-input-secret' => 'Security verification configuration error',
            'invalid-input-secret' => 'Security verification configuration error',
            'missing-input-response' => 'Please complete the security verification',
            'invalid-input-response' => 'Security verification expired or invalid. Please try again.',
            'bad-request' => 'Security verification failed. Please try again.',
            'timeout-or-duplicate' => 'Security verification expired. Please refresh and try again.',
        ];

        foreach ($errorCodes as $code) {
            if (isset($errorMap[$code])) {
                return $errorMap[$code];
            }
        }

        return 'Security verification failed. Please try again.';
    }
}
