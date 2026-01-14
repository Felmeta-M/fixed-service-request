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
     */
    public function index(Request $request): JsonResponse
    {
        $query = AvailableDevice::query()->active();

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
