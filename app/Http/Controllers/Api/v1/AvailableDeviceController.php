<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AvailableDeviceResource;
use App\Services\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AvailableDeviceController extends Controller
{
    private const CACHE_PREFIX = 'available_devices';
    private const CACHE_TTL = 1800; // 30 minutes

    /**
     * Display a listing of active available devices - cached Query Builder
     *
     * Query parameters:
     * - service_type: Filter by service type ('1457567289' for broadband, '1207609454' for voice, '180427974' for combo)
     * - device_type: Direct filter by device type ('broadband', 'voice', 'universal')
     * - vendor: Filter by vendor name
     */
    public function index(Request $request): JsonResponse
    {
        // Build cache key based on filters
        $cacheKey = $this->buildCacheKey($request);

        $devices = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request) {
            $query = DB::table('available_devices')
                ->where('is_active', true)
                ->select([
                    'id',
                    'name',
                    'vendor',
                    'model',
                    'price',
                    'device_type',
                    'description',
                    'image_url',
                    'specifications',
                    'is_active',
                ]);

            // Filter by service type (maps to device type)
            if ($request->has('service_type')) {
                $serviceType = $request->service_type;

                if ($serviceType === '1457567289') {
                    // Broadband service - show broadband and universal devices
                    $query->whereIn('device_type', ['broadband', 'universal']);
                } elseif ($serviceType === '1207609454') {
                    // Voice service - show voice and universal devices
                    $query->whereIn('device_type', ['voice', 'universal']);
                }
                // For combo ('180427974'), return all active devices
            }

            // Direct device_type filter (takes precedence if provided)
            if ($request->has('device_type')) {
                $deviceType = $request->device_type;
                if ($deviceType === 'broadband') {
                    $query->whereIn('device_type', ['broadband', 'universal']);
                } elseif ($deviceType === 'voice') {
                    $query->whereIn('device_type', ['voice', 'universal']);
                } else {
                    $query->where('device_type', $deviceType);
                }
            }

            // Filter by vendor
            if ($request->has('vendor')) {
                $query->where('vendor', $request->vendor);
            }

            return $query->orderBy('price', 'asc')->get();
        });

        // Transform devices
        $devicesData = $devices->map(function ($device) {
            return [
                'id' => $device->id,
                'name' => $device->name,
                'vendor' => $device->vendor,
                'model' => $device->model,
                'price' => (float) $device->price,
                'device_type' => $device->device_type,
                'description' => $device->description,
                'image_url' => $device->image_url,
                'specifications' => $device->specifications ? json_decode($device->specifications, true) : null,
            ];
        })->values()->all();

        return ApiResponse::success($devicesData);
    }

    /**
     * Display the specified resource - Query Builder with caching
     */
    public function show(string $id): JsonResponse
    {
        $cacheKey = self::CACHE_PREFIX . ':single:' . $id;

        $device = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            return DB::table('available_devices')
                ->where('id', $id)
                ->first();
        });

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found.',
            ], 404);
        }

        return ApiResponse::success([
            'id' => $device->id,
            'name' => $device->name,
            'vendor' => $device->vendor,
            'model' => $device->model,
            'price' => (float) $device->price,
            'device_type' => $device->device_type,
            'description' => $device->description,
            'image_url' => $device->image_url,
            'specifications' => $device->specifications ? json_decode($device->specifications, true) : null,
            'is_active' => (bool) $device->is_active,
        ]);
    }

    /**
     * Build a cache key based on request parameters
     */
    protected function buildCacheKey(Request $request): string
    {
        $parts = [self::CACHE_PREFIX, 'list'];

        if ($request->has('service_type')) {
            $parts[] = 'st_' . $request->service_type;
        }

        if ($request->has('device_type')) {
            $parts[] = 'dt_' . $request->device_type;
        }

        if ($request->has('vendor')) {
            $parts[] = 'v_' . md5($request->vendor);
        }

        return implode(':', $parts);
    }

    /**
     * Clear device cache (call when devices are modified)
     */
    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_PREFIX . ':list');
        // Also clear filtered caches by pattern if using Redis
        // For file/database cache, you may need to track keys
    }
}
