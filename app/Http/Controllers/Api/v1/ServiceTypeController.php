<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\ServiceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ServiceTypeController extends Controller
{
    private const CACHE_KEY = 'service_types:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display a listing of active service types - cached Query Builder
     */
    public function index()
    {
        $serviceTypes = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('service_types')
                ->select(['id', 'code', 'name', 'description', 'icon', 'color', 'status', 'recommended', 'sort_order'])
                ->where('status', true)
                ->orderBy('sort_order')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $serviceTypes,
        ]);
    }

    /**
     * Store a new service type
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:service_types,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'status' => 'boolean',
            'recommended' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $serviceType = ServiceType::create($validated);

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $serviceType,
        ], 201);
    }

    /**
     * Display the specified service type
     */
    public function show(ServiceType $serviceType)
    {
        return response()->json([
            'success' => true,
            'data' => $serviceType,
        ]);
    }

    /**
     * Update the specified service type
     */
    public function update(Request $request, ServiceType $serviceType)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:service_types,code,' . $serviceType->id,
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'status' => 'boolean',
            'recommended' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $serviceType->update($validated);

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $serviceType,
        ]);
    }

    /**
     * Remove the specified service type
     */
    public function destroy(ServiceType $serviceType)
    {
        $serviceType->delete();

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Service type deleted successfully',
        ]);
    }
}
