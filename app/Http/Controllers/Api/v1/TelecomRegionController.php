<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\EthioZone;
use App\Models\TelecomRegion;
use App\Models\Zone;
use App\Services\ZoneService;
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

    /**
     * Get telecom regions by zone_id.
     *
     * Flow: zone_id → zones.zone_code → ethio_zones.name → telecom_regions (where zone = name)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function byZoneId(Request $request): JsonResponse
    {
        $zoneId = $request->input('zone_id');

        if (!$zoneId) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide zone_id.',
            ], 400);
        }

        // Use ZoneService - single source of truth
        $zoneService = app(ZoneService::class);
        $zoneCode = $zoneService->getZoneCodeById($zoneId);
        
        if (!$zoneCode) {
            return response()->json([
                'success' => false,
                'message' => 'Zone not found or zone_code is missing.',
                'data' => [],
            ], 404);
        }

        // zone_code from zones table is actually the EthioZone name
        $ethioZone = $zoneService->getEthioZoneByName($zoneCode);

        if (!$ethioZone) {
            return response()->json([
                'success' => false,
                'message' => 'Ethio zone not found for this zone.',
                'data' => [],
            ], 404);
        }

        // Step 3: Get telecom regions where zone matches ethio_zone name
        $cacheKey = 'telecom_regions_by_ethio_zone_' . $ethioZone->id;

        // Case-insensitive exact match first
        $zoneName = strtolower($ethioZone->name);
        $regions = TelecomRegion::active()
            ->whereRaw('LOWER(zone) = ?', [$zoneName])
            ->select(['id', 'area_id', 'area_name', 'zone'])
            ->orderBy('area_name')
            ->get();

        // If no exact match, try case-insensitive prefix match (e.g., "NAAZ" matches "NAAZ-1", "NAAZ-2")
        if ($regions->isEmpty()) {
            $regions = TelecomRegion::active()
                ->whereRaw('LOWER(zone) LIKE ?', [$zoneName . '%'])
                ->select(['id', 'area_id', 'area_name', 'zone'])
                ->orderBy('area_name')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $regions,
            'count' => $regions->count(),
            'ethio_zone' => $ethioZone->name,
        ]);
    }
}
