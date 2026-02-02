<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Request;
use Illuminate\Http\Client\Response;
use RuntimeException;

abstract class BaseApiService
{
    protected int $timeout = 15;
    protected int $maxRetries = 3;
    protected int $rateLimit = 15;       // requests per decay window
    protected int $decaySeconds = 360;    // seconds for rate limit

    // ========================================
    // TIMESTAMP HELPERS (DRY)
    // ========================================

    /**
     * Generate transaction ID (YmdHis format).
     */
    protected function generateTransactionId(): string
    {
        return now()->format('YmdHis') . substr(uniqid(), -4);
    }

    /**
     * Get process time (YmdHis format).
     */
    protected function processTime(): string
    {
        return now()->format('YmdHis');
    }

    /**
     * Get completed date (YmdHis format).
     */
    protected function completedDate(): string
    {
        return now()->format('YmdHis');
    }

    /**
     * Get transaction ID (alias for backward compatibility).
     */
    protected function transactionId(): string
    {
        return $this->processTime();
    }

    protected function sessionId(): string
    {
        return uniqid();
    }

    protected function version(): string
    {
        return '1';
    }

    protected function language(): string
    {
        return '2002';
    }

    protected function channelId(): string
    {
        return '116';
    }

    protected function technicalChannelId(): string
    {
        return '53';
    }

    protected function tenantId(): string
    {
        return config('services.ng.tenant_id');
    }

    protected function accessUser(): string
    {
        return config('services.ng.access_user');
    }

    protected function accessPwd(): string
    {
        return config('services.ng.access_pwd');
    }

    protected function operatorId(): string
    {
        return config('services.ng.operator_id');
    }

    // ========================================
    // CUSTOMER CONTEXT HELPERS (DRY)
    // ========================================

    /**
     * Get current customer code.
     */
    protected function customerCode(?string $fallback = null): ?string
    {
        return CustomerContext::code($fallback);
    }

    /**
     * Get current customer name.
     */
    protected function customerName(?string $fallback = null): ?string
    {
        return CustomerContext::name($fallback);
    }

    /**
     * Get current customer phone (last 9 digits).
     */
    protected function customerPhone(?string $fallback = null): string
    {
        return CustomerContext::phone($fallback);
    }

    /**
     * Get current customer email.
     */
    protected function customerEmail(?string $fallback = null): ?string
    {
        return CustomerContext::email($fallback);
    }

    /**
     * Get primary contact info.
     */
    protected function getPrimaryContact(array $data = []): array
    {
        return [
            'contact_person' => $data['contact_person'] ?? $this->customerName(''),
            'contact_no' => $this->formatPhoneNumber($data['contact_no'] ?? $this->customerPhone('')),
            'contact_email' => $data['contact_email'] ?? $this->customerEmail(''),
        ];
    }

    /**
     * Get secondary contact info.
     */
    protected function getSecondaryContact(array $data = []): array
    {
        return [
            'sec_contact_person' => $data['sec_contact_person'] ?? null,
            'sec_contact_no' => !empty($data['sec_contact_no'])
                ? $this->formatPhoneNumber($data['sec_contact_no'])
                : null,
            'sec_contact_email' => $data['sec_contact_email'] ?? null,
        ];
    }

    /**
     * Hydrate request data with customer context.
     */
    protected function hydrateWithCustomerData(array $data): array
    {
        return CustomerContext::hydrateData($data);
    }

    /**
     * Check if user is authenticated.
     */
    protected function isAuthenticated(): bool
    {
        return CustomerContext::isAuthenticated();
    }

    /**
     * Get customer profile info for subscription services.
     */
    protected function getCustomerProfile(array $overrides = []): array
    {
        return CustomerContext::profileInfo($overrides);
    }

    /**
     * Get customer address info.
     */
    protected function getCustomerAddress(array $overrides = []): array
    {
        return CustomerContext::addressInfo($overrides);
    }

    /**
     * Get BSS classification info (customer type, category, etc).
     */
    protected function getBssClassification(array $overrides = []): array
    {
        return CustomerContext::bssClassification($overrides);
    }

    /**
     * Get notification mode.
     */
    protected function notificationMode(?string $fallback = '2'): string
    {
        return CustomerContext::notificationMode($fallback);
    }

    /**
     * Get credit class.
     */
    protected function creditClass(?string $fallback = 'Excellent'): string
    {
        return CustomerContext::creditClass($fallback);
    }

    /**
     * Get service name for logging (defaults to class name without namespace)
     */
    protected function getServiceName(): string
    {
        $className = get_class($this);
        $parts = explode('\\', $className);
        return end($parts);
    }

    /**
     * Each concrete service must define its endpoint
     */
    abstract protected function endpoint(): string;

    /**
     * Optional: override default headers
     */
    protected function headers(): array
    {
        return [
            'Content-Type' => 'text/xml; charset=utf-8',
        ];
    }

    /**
     * Optional: add Idempotency-Key if needed
     */
    protected function idempotencyKey(): string
    {
        return uniqid();
    }

    /**
     * Rate-limited request execution
     */
    protected function executeRequest(string $xmlPayload): string
    {
        $ip = Request::ip() ?? 'unknown';
        $key = "{$ip}:{$this->endpoint()}";

        if (RateLimiter::tooManyAttempts($key, $this->rateLimit)) {
            throw new RuntimeException("Rate limit exceeded for IP {$ip}. Try again later.");
        }

        RateLimiter::hit($key, $this->decaySeconds);

        $serviceName = $this->getServiceName();

        /** @var Response $response */
        $response = Http::logged($serviceName, 'api')
            ->withHeaders($this->headers())
            ->timeout($this->timeout)
            ->retry($this->maxRetries, 200, throw: false)
            ->withOptions([
                'verify' => false, // app()->isProduction()
            ])
            ->withBody($xmlPayload, 'text/xml')
            ->post($this->endpoint());

        if ($response->failed()) {
            $this->logError($response);
            throw new RuntimeException("API request to {$this->endpoint()} failed.");
        }

        return $response->body();
    }

    protected function parseXmlResponse(string $xml): \SimpleXMLElement
    {
        libxml_use_internal_errors(true);
        $parsed = simplexml_load_string($xml);
        if ($parsed === false) {
            $errors = array_map(fn($e) => $e->message, libxml_get_errors());
            libxml_clear_errors();

            AppLogger::api()->error('Failed to parse XML response', [
                'endpoint' => $this->endpoint() ?? 'unknown',
                'xml_preview' => substr($xml, 0, 500),
                'errors' => $errors,
            ]);

            throw new \RuntimeException('Invalid XML response from API');
        }

        return $parsed;
    }


    /**
     * Log errors centrally
     */
    protected function logError(Response $response): void
    {
        AppLogger::api()->error('API request failed', [
            'endpoint' => $this->endpoint(),
            'status_code' => $response->status(),
            'response' => substr($response->body(), 0, 1000),
        ]);
    }

    /**
     * Parse and convert bandwidth to KB.
     *
     * Examples:
     *   - "10m" → 10 * 1024 = 10240 KB
     *   - "1gbps" → 1 * 1024 * 1024 = 1048576 KB
     *   - Plain number (e.g., 2048) → returned as-is (already KB)
     */
    protected function parseBandwidth(string|int $value): int
    {
        $value = strtolower(trim((string) $value));

        // Handle "10m" or "10mb" or "10mbps" format (MB to KB)
        if (preg_match('/^(\d+)(m|mb|mbps)$/', $value, $matches)) {
            return (int) $matches[1] * 1024;
        }

        // Handle "1gbps" or "1g" format (GB to KB)
        if (preg_match('/^(\d+)(g|gb|gbps)$/', $value, $matches)) {
            return (int) $matches[1] * 1024 * 1024;
        }

        // Plain number - return as-is (already in KB)
        return (int) $value;
    }

    /**
     * Format phone number to last 9 digits.
     */
    protected function formatPhoneNumber(?string $phoneNumber): string
    {
        if (empty($phoneNumber)) {
            return '';
        }

        $digits = preg_replace('/\D/', '', $phoneNumber);
        return substr($digits, -9);
    }

    /**
     * Asynchronous request (new)
     * Accepts an array of payloads and returns a pool of responses
     */
    protected function executeAsyncRequest(array $payloads, callable $onSuccess, callable $onError): void
    {
        $ip = Request::ip() ?? 'unknown';

        // Prepare a pool of requests
        $requests = [];
        foreach ($payloads as $payload) {
            $key = "{$ip}:{$this->endpoint()}";
            if (RateLimiter::tooManyAttempts($key, $this->rateLimit)) {
                AppLogger::api()->warning('Rate limit exceeded for async request', [
                    'ip' => $ip,
                    'endpoint' => $this->endpoint(),
                ]);
                continue;
            }

            RateLimiter::hit($key, $this->decaySeconds);

            $serviceName = $this->getServiceName();

            $requests[] = Http::logged($serviceName, 'api')
                ->withHeaders(array_merge(
                    $this->headers(),
                    ['Idempotency-Key' => $this->idempotencyKey()]
                ))
                ->timeout($this->timeout)
                ->retry($this->maxRetries, 200, throw: false)
                ->withBody($payload, 'text/xml')
                ->async()
                ->post($this->endpoint());
        }

        // Process responses asynchronously
        $responses = Http::pool(fn($pool) => $requests);

        foreach ($responses as $response) {
            try {
                if ($response->failed()) {
                    $this->logError($response);
                    if ($onError)
                        $onError($response);
                    continue;
                }

                $parsed = $this->parseXmlResponse($response->body());
                $onSuccess($parsed);
            } catch (\Throwable $e) {
                AppLogger::api()->exception($e, 'Async request exception');
                if ($onError)
                    $onError($e);
            }
        }
    }
}
