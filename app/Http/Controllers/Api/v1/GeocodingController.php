<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GeocodingController - Secure proxy for Google Geocoding API.
 *
 * Security features:
 * - API key stays server-side
 * - Rate limiting per user/IP
 * - Input validation
 * - Response caching
 */
class GeocodingController extends Controller
{
    public function __construct(
        private readonly GeocodingService $geocodingService
    ) {}

    /**
     * Reverse geocode: Get address from coordinates.
     *
     * POST /api/v1/geocode/reverse
     * Body: { "latitude": 9.0192, "longitude": 38.7525 }
     */
    public function reverse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        // Rate limit by user ID or IP
        $identifier = $request->user()?->id ?? $request->ip();

        if (!$this->geocodingService->checkRateLimit($identifier)) {
            return response()->json([
                'success' => false,
                'error' => 'Too many requests. Please try again later.',
            ], 429);
        }

        $result = $this->geocodingService->reverseGeocode(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        return response()->json($result);
    }

    /**
     * Forward geocode: Get coordinates from address.
     *
     * POST /api/v1/geocode/address
     * Body: { "address": "Bole, Addis Ababa, Ethiopia" }
     */
    public function address(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address' => 'required|string|min:3|max:500',
        ]);

        // Rate limit by user ID or IP
        $identifier = $request->user()?->id ?? $request->ip();

        if (!$this->geocodingService->checkRateLimit($identifier)) {
            return response()->json([
                'success' => false,
                'error' => 'Too many requests. Please try again later.',
            ], 429);
        }

        $result = $this->geocodingService->geocodeAddress($validated['address']);

        return response()->json($result);
    }
}
