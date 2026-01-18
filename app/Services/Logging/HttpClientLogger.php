<?php

namespace App\Services\Logging;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * HTTP Client Logger - Automatically logs all external HTTP requests.
 *
 * Usage:
 *   // Register in AppServiceProvider boot()
 *   HttpClientLogger::register();
 *
 *   // Or use the logged() macro on individual requests:
 *   Http::logged('TelebirrService')->post($url, $data);
 *   Http::logged('FabricAPI', 'payment')->timeout(30)->get($url);
 *
 * Features:
 * - Automatic request/response logging
 * - Performance timing
 * - Sensitive data masking
 * - Error logging with full context
 * - Configurable per-service logging
 */
class HttpClientLogger
{
    protected static array $sensitiveHeaders = [
        'authorization',
        'x-api-key',
        'x-auth-token',
        'cookie',
        'x-csrf-token',
    ];

    protected static array $sensitiveBodyKeys = [
        'password',
        'secret',
        'token',
        'api_key',
        'apikey',
        'access_token',
        'refresh_token',
        'private_key',
        'credential',
        'otp',
        'pin',
        'card_number',
        'cvv',
    ];

    /**
     * Register HTTP client macros for logging
     */
    public static function register(): void
    {
        // Macro for easy logged HTTP requests
        Http::macro('logged', function (string $service, string $channel = 'api') {
            return Http::withMiddleware(
                HttpClientLogger::createLoggingMiddleware($service, $channel)
            );
        });

        // Global logging for all HTTP requests (optional, can be enabled via config)
        if (config('logging.http_client_log_all', false)) {
            Http::globalMiddleware(
                HttpClientLogger::createLoggingMiddleware('External', 'api')
            );
        }
    }

    /**
     * Create a Guzzle middleware for logging
     */
    public static function createLoggingMiddleware(string $service, string $channel = 'api'): callable
    {
        return function (callable $handler) use ($service, $channel) {
            return function ($request, array $options) use ($handler, $service, $channel) {
                $startTime = microtime(true);
                $requestId = AppLogger::getRequestId();

                // Log the request
                $requestContext = self::buildRequestContext($request, $service);

                $logger = match ($channel) {
                    'payment' => AppLogger::payment(),
                    'auth' => AppLogger::auth(),
                    default => AppLogger::api(),
                };

                $logger->debug("HTTP Request: {$service}", array_merge(
                    ['request_id' => $requestId],
                    $requestContext
                ));

                // Execute the request
                return $handler($request, $options)->then(
                    function ($response) use ($startTime, $service, $channel, $requestContext, $logger, $requestId) {
                        $duration = microtime(true) - $startTime;
                        $statusCode = $response->getStatusCode();

                        $context = array_merge($requestContext, [
                            'request_id' => $requestId,
                            'status_code' => $statusCode,
                            'duration_ms' => round($duration * 1000, 2),
                            'response' => self::extractResponseInfo($response, $statusCode),
                        ]);

                        $level = match (true) {
                            $statusCode >= 500 => 'error',
                            $statusCode >= 400 => 'warning',
                            default => 'debug',
                        };

                        $logger->$level(
                            "HTTP Response: {$service} ({$statusCode})",
                            $context
                        );

                        // Log slow external requests
                        if ($duration > 5.0) {
                            AppLogger::performance()->warning('Slow external HTTP request', [
                                'service' => $service,
                                'url' => $requestContext['url'] ?? 'unknown',
                                'duration_ms' => round($duration * 1000, 2),
                            ]);
                        }

                        return $response;
                    },
                    function ($exception) use ($startTime, $service, $requestContext, $logger, $requestId) {
                        $duration = microtime(true) - $startTime;

                        $context = array_merge($requestContext, [
                            'request_id' => $requestId,
                            'duration_ms' => round($duration * 1000, 2),
                            'error' => [
                                'class' => get_class($exception),
                                'message' => $exception->getMessage(),
                                'code' => $exception->getCode(),
                            ],
                        ]);

                        $logger->error("HTTP Request Failed: {$service}", $context);

                        throw $exception;
                    }
                );
            };
        };
    }

    /**
     * Build request context for logging
     */
    protected static function buildRequestContext($request, string $service): array
    {
        $uri = $request->getUri();

        return [
            'service' => $service,
            'method' => $request->getMethod(),
            'url' => self::maskUrl((string) $uri),
            'host' => $uri->getHost(),
            'path' => $uri->getPath(),
            'headers' => self::maskHeaders($request->getHeaders()),
            'body' => self::extractRequestBody($request),
        ];
    }

    /**
     * Extract request body for logging
     */
    protected static function extractRequestBody($request): ?array
    {
        $body = (string) $request->getBody();

        if (empty($body)) {
            return null;
        }

        // Try to decode as JSON
        $decoded = json_decode($body, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return self::maskSensitiveData($decoded);
        }

        // For non-JSON, just log that there's a body
        return ['_raw' => Str::limit($body, 500)];
    }

    /**
     * Extract response info for logging
     */
    protected static function extractResponseInfo($response, int $statusCode): ?array
    {
        $body = (string) $response->getBody();

        if (empty($body)) {
            return null;
        }

        // Try to decode as JSON
        $decoded = json_decode($body, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            // For successful requests, return full decoded response (but mask sensitive data)
            // For error requests, limit array size to first 20 items to avoid verbosity
            if ($statusCode < 400) {
                return self::maskSensitiveData($decoded);
            }
            return self::maskSensitiveData(
                is_array($decoded) ? array_slice($decoded, 0, 20) : $decoded
            );
        }

        // For XML or other text responses, limit size based on status
        $limit = $statusCode < 400 ? 5000 : 1000;
        return ['_raw' => Str::limit($body, $limit)];
    }

    /**
     * Mask sensitive headers
     */
    protected static function maskHeaders(array $headers): array
    {
        $masked = [];

        foreach ($headers as $name => $values) {
            $lowerName = strtolower($name);

            if (in_array($lowerName, self::$sensitiveHeaders)) {
                $masked[$name] = '***REDACTED***';
            } else {
                $masked[$name] = is_array($values) ? implode(', ', $values) : $values;
            }
        }

        return $masked;
    }

    /**
     * Mask sensitive URL parameters
     */
    protected static function maskUrl(string $url): string
    {
        return preg_replace(
            '/(token|key|secret|password|api_key|access_token)=([^&]+)/i',
            '$1=***REDACTED***',
            $url
        );
    }

    /**
     * Recursively mask sensitive data in arrays
     */
    protected static function maskSensitiveData(mixed $data, int $depth = 0): mixed
    {
        if ($depth > 5) {
            return '[MAX_DEPTH]';
        }

        if (!is_array($data)) {
            return $data;
        }

        $masked = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            if (in_array($lowerKey, self::$sensitiveBodyKeys)) {
                $masked[$key] = '***REDACTED***';
            } elseif (is_array($value)) {
                $masked[$key] = self::maskSensitiveData($value, $depth + 1);
            } elseif (is_string($value) && strlen($value) > 1000) {
                $masked[$key] = Str::limit($value, 1000) . '...[TRUNCATED]';
            } else {
                $masked[$key] = $value;
            }
        }

        return $masked;
    }
}
