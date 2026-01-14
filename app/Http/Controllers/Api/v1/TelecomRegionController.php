<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TelecomRegion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TelecomRegionController extends Controller
{
    /**
     * Get all active telecom regions.
     *
     * Returns a list of telecom regions for dropdown selection.
     * Results are cached for 24 hours since this data rarely changes.
     */
    public function index(Request $request): JsonResponse
    {
        $cacheKey = 'telecom_regions';

        // Filter by zone if provided
        if ($request->filled('zone')) {
            $cacheKey .= '_zone_' . $request->zone;
        }

        $regions = Cache::remember($cacheKey, now()->addHours(24), function () use ($request) {
            $query = TelecomRegion::active()
                ->select(['id', 'area_id', 'area_name', 'zone'])
                ->orderBy('area_name');

            if ($request->filled('zone')) {
                $query->byZone($request->zone);
            }

            return $query->get();
        });

        return response()->json([
            'success' => true,
            'data' => $regions,
            'count' => $regions->count(),
        ]);
    }

    /**
     * Get a single telecom region by area_id or name.
     */
    public function show(Request $request): JsonResponse
    {
        $identifier = $request->input('area_id') ?? $request->input('name');

        if (!$identifier) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide area_id or name.',
            ], 400);
        }

        // Try to find by area_id first, then by name
        $region = TelecomRegion::active()
            ->where('area_id', $identifier)
            ->orWhereRaw('LOWER(area_name) = ?', [strtolower($identifier)])
            ->first(['id', 'area_id', 'area_name', 'zone']);

        if (!$region) {
            return response()->json([
                'success' => false,
                'message' => 'Telecom region not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $region,
        ]);
    }
}
