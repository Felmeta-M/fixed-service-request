<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;

/**
 * GeocodingService - Server-side proxy for Google Geocoding API.
 *
 * Security benefits:
 * - API key never exposed to frontend for geocoding
 * - Rate limiting to prevent abuse
 * - Response caching to reduce API costs
 * - Request validation and sanitization
 */
class GeocodingService
{
    private const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
    private const CACHE_TTL = 86400; // 24 hours
    private const RATE_LIMIT_KEY = 'geocoding';
    private const RATE_LIMIT_MAX = 60; // requests per minute
    private const RATE_LIMIT_DECAY = 60; // seconds

    /**
     * Reverse geocode: Convert coordinates to address.
     */
    public function reverseGeocode(float $lat, float $lng): array
    {
        $cacheKey = "geocode:reverse:{$lat}:{$lng}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($lat, $lng) {
            return $this->callGoogleApi([
                'latlng' => "{$lat},{$lng}",
            ]);
        });
    }

    /**
     * Forward geocode: Convert address to coordinates.
     */
    public function geocodeAddress(string $address): array
    {
        $cacheKey = 'geocode:address:' . md5($address);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($address) {
            return $this->callGoogleApi([
                'address' => $address,
            ]);
        });
    }

    /**
     * Check rate limit before processing request.
     */
    public function checkRateLimit(string $identifier): bool
    {
        $key = self::RATE_LIMIT_KEY . ':' . $identifier;

        if (RateLimiter::tooManyAttempts($key, self::RATE_LIMIT_MAX)) {
            return false;
        }

        RateLimiter::hit($key, self::RATE_LIMIT_DECAY);
        return true;
    }

    /**
     * Get remaining rate limit attempts.
     */
    public function getRateLimitRemaining(string $identifier): int
    {
        $key = self::RATE_LIMIT_KEY . ':' . $identifier;
        return RateLimiter::remaining($key, self::RATE_LIMIT_MAX);
    }

    /**
     * Call Google Geocoding API.
     */
    private function callGoogleApi(array $params): array
    {
        $apiKey = config('services.google.maps_frontend_key');

        if (empty($apiKey)) {
            AppLogger::api()->error('Google API key is not configured');
            return [
                'success' => false,
                'error' => 'Geocoding service is not configured',
                'results' => [],
            ];
        }

        try {
            $response = Http::timeout(10)->get(self::GEOCODE_URL, array_merge($params, [
                'key' => $apiKey,
            ]));

            if (!$response->successful()) {
                AppLogger::api()->error('Google Geocoding API HTTP error', [
                    'status' => $response->status(),
                    'params' => $params,
                ]);
                return [
                    'success' => false,
                    'error' => 'Geocoding request failed',
                    'results' => [],
                ];
            }

            $data = $response->json();

            if ($data['status'] !== 'OK' && $data['status'] !== 'ZERO_RESULTS') {
                AppLogger::api()->warning('Google Geocoding API error status', [
                    'status' => $data['status'],
                    'error_message' => $data['error_message'] ?? null,
                    'params' => $params,
                ]);
            }

            return [
                'success' => $data['status'] === 'OK',
                'status' => $data['status'],
                'results' => $data['results'] ?? [],
            ];
        } catch (\Throwable $e) {
            AppLogger::api()->exception($e, 'Google Geocoding API exception', [
                'params' => $params,
            ]);
            return [
                'success' => false,
                'error' => 'Geocoding service temporarily unavailable',
                'results' => [],
            ];
        }
    }
}
