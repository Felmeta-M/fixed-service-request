<?php

namespace App\Http\Middleware;

use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Advanced API Rate Limiter
 *
 * Features:
 * - Multiple rate limit tiers
 * - User-based and IP-based limiting
 * - Endpoint-specific limits
 * - Burst protection
 * - Clear headers for client feedback
 */
class ApiRateLimiter
{
    /**
     * Default limits by tier
     */
    protected array $tiers = [
        'public' => [
            'requests' => 60,
            'period' => 60, // per minute
        ],
        'authenticated' => [
            'requests' => 120,
            'period' => 60,
        ],
        'sensitive' => [
            'requests' => 10,
            'period' => 60,
        ],
        'auth' => [
            'requests' => 5,
            'period' => 60,
        ],
    ];

    /**
     * Endpoints with custom limits
     */
    protected array $customLimits = [
        'api/v1/auth/login' => 'auth',
        'api/v1/auth/otp' => 'auth',
        'api/v1/payments' => 'sensitive',
        'api/v1/survey-orders' => 'sensitive',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $tier = 'public'): Response
    {
        // Determine the appropriate tier
        $tier = $this->determineTier($request, $tier);
        $limits = $this->tiers[$tier] ?? $this->tiers['public'];

        // Build rate limit key
        $key = $this->buildKey($request, $tier);

        // Check rate limit
        if (RateLimiter::tooManyAttempts($key, $limits['requests'])) {
            return $this->buildRateLimitResponse($key, $limits);
        }

        // Record the hit
        RateLimiter::hit($key, $limits['period']);

        // Process the request
        $response = $next($request);

        // Add rate limit headers
        return $this->addRateLimitHeaders($response, $key, $limits);
    }

    /**
     * Determine the rate limit tier for the request
     */
    protected function determineTier(Request $request, string $defaultTier): string
    {
        $path = $request->path();

        // Check custom endpoint limits
        foreach ($this->customLimits as $endpoint => $tier) {
            if (str_starts_with($path, $endpoint)) {
                return $tier;
            }
        }

        // Use authenticated tier for logged-in users
        if ($request->user()) {
            return 'authenticated';
        }

        return $defaultTier;
    }

    /**
     * Build a unique rate limit key
     */
    protected function buildKey(Request $request, string $tier): string
    {
        $user = $request->user();

        if ($user) {
            // User-based limiting
            return "rate_limit:{$tier}:user:" . ($user->id ?? $user->customer_code ?? 'unknown');
        }

        // IP-based limiting
        return "rate_limit:{$tier}:ip:" . $request->ip();
    }

    /**
     * Build rate limit exceeded response
     */
    protected function buildRateLimitResponse(string $key, array $limits): Response
    {
        $retryAfter = RateLimiter::availableIn($key);

        AppLogger::security()->warning('Rate limit exceeded', [
            'key' => $key,
            'retry_after' => $retryAfter,
        ]);

        return ApiResponse::rateLimited($retryAfter);
    }

    /**
     * Add rate limit headers to response
     */
    protected function addRateLimitHeaders(Response $response, string $key, array $limits): Response
    {
        $remaining = RateLimiter::remaining($key, $limits['requests']);
        $retryAfter = RateLimiter::availableIn($key);

        $response->headers->set('X-RateLimit-Limit', (string) $limits['requests']);
        $response->headers->set('X-RateLimit-Remaining', (string) max(0, $remaining));
        $response->headers->set('X-RateLimit-Reset', (string) (time() + $retryAfter));

        return $response;
    }
}
