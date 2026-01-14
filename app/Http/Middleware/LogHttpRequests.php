<?php

namespace App\Http\Middleware;

use App\Services\Logging\AppLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogHttpRequests
{
    /**
     * Routes to exclude from logging (for high-frequency or sensitive endpoints)
     */
    protected array $excludedRoutes = [
        'up',
        'health',
        'livewire/*',
        '_debugbar/*',
        'horizon/*',
    ];

    /**
     * Headers that should not be logged
     */
    protected array $excludedHeaders = [
        'authorization',
        'cookie',
        'x-csrf-token',
        'x-xsrf-token',
    ];

    /**
     * Request body keys that should be masked
     */
    protected array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'secret',
        'api_key',
        'otp',
        'pin',
        'card_number',
        'cvv',
        'verification_code',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip logging for excluded routes
        if ($this->shouldExclude($request)) {
            return $next($request);
        }

        // Set request ID header for distributed tracing
        $requestId = $request->header('X-Request-ID') ?? AppLogger::getRequestId();
        AppLogger::setRequestId($requestId);

        $startTime = microtime(true);

        // Process the request
        $response = $next($request);

        // Calculate duration
        $duration = microtime(true) - $startTime;

        // Log the request/response
        $this->logRequest($request, $response, $duration, $requestId);

        // Add request ID to response headers for client-side correlation
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }

    /**
     * Log the HTTP request and response
     */
    protected function logRequest(
        Request $request,
        Response $response,
        float $duration,
        string $requestId
    ): void {
        $statusCode = $response->getStatusCode();

        $context = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'route' => $request->route()?->getName() ?? $request->path(),
            'ip' => $request->ip(),
            'user_agent' => Str::limit($request->userAgent() ?? '', 200),
            'status_code' => $statusCode,
            'duration_ms' => round($duration * 1000, 2),
            'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
        ];

        // Add request headers (excluding sensitive ones)
        $context['headers'] = $this->filterHeaders($request->headers->all());

        // Add request body for non-GET requests (with sensitive data masked)
        if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            $context['request_body'] = $this->maskSensitiveData($request->except(['_token']));
        }

        // Add query parameters for GET requests
        if ($request->method() === 'GET' && $request->query()) {
            $context['query'] = $this->maskSensitiveData($request->query());
        }

        // Add response info for error responses
        if ($statusCode >= 400) {
            $responseContent = $response->getContent();
            if ($responseContent && strlen($responseContent) < 2000) {
                $decoded = json_decode($responseContent, true);
                $context['response'] = $decoded ?: Str::limit($responseContent, 500);
            }
        }

        // Log with appropriate level based on status code
        $logger = AppLogger::http();
        $message = sprintf(
            '%s %s - %d',
            $request->method(),
            $request->path(),
            $statusCode
        );

        match (true) {
            $statusCode >= 500 => $logger->error($message, $context),
            $statusCode >= 400 => $logger->warning($message, $context),
            $statusCode >= 300 => $logger->info($message, $context),
            default => $logger->info($message, $context),
        };

        // Log slow requests separately
        if ($duration > 3.0) { // More than 3 seconds
            AppLogger::performance()->warning('Slow request detected', [
                'request_id' => $requestId,
                'url' => $request->fullUrl(),
                'duration_ms' => round($duration * 1000, 2),
            ]);
        }
    }

    /**
     * Check if the request should be excluded from logging
     */
    protected function shouldExclude(Request $request): bool
    {
        $path = $request->path();

        foreach ($this->excludedRoutes as $pattern) {
            if (Str::is($pattern, $path)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filter out sensitive headers
     */
    protected function filterHeaders(array $headers): array
    {
        $filtered = [];
        foreach ($headers as $key => $value) {
            if (!in_array(strtolower($key), $this->excludedHeaders)) {
                $filtered[$key] = is_array($value) ? implode(', ', $value) : $value;
            }
        }
        return $filtered;
    }

    /**
     * Mask sensitive data in arrays
     */
    protected function maskSensitiveData(mixed $data, int $depth = 0): mixed
    {
        if ($depth > 5) {
            return '[MAX_DEPTH_EXCEEDED]';
        }

        if (!is_array($data)) {
            return $data;
        }

        $masked = [];
        foreach ($data as $key => $value) {
            if (in_array(strtolower((string) $key), $this->sensitiveKeys)) {
                $masked[$key] = '***REDACTED***';
            } elseif (is_array($value)) {
                $masked[$key] = $this->maskSensitiveData($value, $depth + 1);
            } else {
                $masked[$key] = $value;
            }
        }

        return $masked;
    }
}
