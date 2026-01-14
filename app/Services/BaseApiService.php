<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
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
    protected function executeRequest(string $xmlPayload): Response|string
    {
        $ip = Request::ip() ?? 'unknown';
        $key = "{$ip}:{$this->endpoint()}";

        if (RateLimiter::tooManyAttempts($key, $this->rateLimit)) {
            throw new RuntimeException("Rate limit exceeded for IP {$ip}. Try again later.");
        }

        RateLimiter::hit($key, $this->decaySeconds);

        $response = Http::withHeaders($this->headers())
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

            $requests[] = Http::withHeaders(array_merge(
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
                    if ($onError) $onError($response);
                    continue;
                }

                $parsed = $this->parseXmlResponse($response->body());
                $onSuccess($parsed);
            } catch (\Throwable $e) {
                AppLogger::api()->exception($e, 'Async request exception');
                if ($onError) $onError($e);
            }
        }
    }
}
