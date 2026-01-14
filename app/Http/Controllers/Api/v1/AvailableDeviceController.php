<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AvailableDeviceResource;
use App\Models\AvailableDevice;
use App\Services\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AvailableDeviceController extends Controller
{
    /**
     * Display a listing of active available devices.
     * 
     * Query parameters:
     * - service_type: Filter by service type ('1457567289' for broadband, '1207609454' for voice, '180427974' for combo)
     * - device_type: Direct filter by device type ('broadband', 'voice', 'universal')
     * - vendor: Filter by vendor name
     */
    public function index(Request $request): JsonResponse
    {
        $query = AvailableDevice::query()->active();

        // Filter by service type (maps to device type)
        if ($request->has('service_type')) {
            $serviceType = $request->service_type;
            
            // Map service types to device types
            // '1457567289' = Fixed Broadband -> show broadband devices
            // '1207609454' = Fixed Voice -> show voice devices
            // '180427974' = Combo -> return all (will be filtered on frontend)
            if ($serviceType === '1457567289') {
                // Broadband service - show broadband and universal devices
                $query->byType('broadband');
            } elseif ($serviceType === '1207609454') {
                // Voice service - show voice and universal devices
                $query->byType('voice');
            }
            // For combo ('180427974'), don't filter here - return all devices
        }

        // Direct device_type filter (takes precedence if provided)
        if ($request->has('device_type')) {
            $query->byType($request->device_type);
        }

        // Optional: Filter by vendor
        if ($request->has('vendor')) {
            $query->where('vendor', $request->vendor);
        }

        // Order by price ascending by default
        $query->orderBy('price', 'asc');

        $devices = $query->get();

        // Transform devices through resources and resolve to arrays
        $devicesData = $devices->map(function ($device) use ($request) {
            return (new AvailableDeviceResource($device))->toArray($request);
        })->values()->all();

        return ApiResponse::success($devicesData);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse|AvailableDeviceResource
    {
        $device = AvailableDevice::find($id);

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found.',
            ], 404);
        }

        return new AvailableDeviceResource($device);
    }
}
