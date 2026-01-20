<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\CustomerLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CustomerLevelController extends Controller
{
    /**
     * Display a listing of active customer levels.
     */
    public function index(): JsonResponse
    {
        $customerLevels = Cache::remember('customer_levels.active', 3600, function () {
            return CustomerLevel::active()
                ->ordered()
                ->get()
                ->map(function ($level) {
                    return [
                        'value' => $level->code,
                        'label' => $level->name,
                    ];
                });
        });

        return response()->json([
            'success' => true,
            'data' => $customerLevels,
        ]);
    }

    /**
     * Display a listing of all customer levels (for admin).
     */
    public function all(): JsonResponse
    {
        $customerLevels = CustomerLevel::ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $customerLevels,
        ]);
    }

    /**
     * Store a newly created customer level.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:customer_levels,code',
            'name' => 'required|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $customerLevel = CustomerLevel::create($validated);

        Cache::forget('customer_levels.active');

        return response()->json([
            'success' => true,
            'data' => $customerLevel,
            'message' => 'Customer level created successfully',
        ], 201);
    }

    /**
     * Display the specified customer level.
     */
    public function show(CustomerLevel $customerLevel): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $customerLevel,
        ]);
    }

    /**
     * Update the specified customer level.
     */
    public function update(Request $request, CustomerLevel $customerLevel): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:customer_levels,code,' . $customerLevel->id,
            'name' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $customerLevel->update($validated);

        Cache::forget('customer_levels.active');

        return response()->json([
            'success' => true,
            'data' => $customerLevel,
            'message' => 'Customer level updated successfully',
        ]);
    }

    /**
     * Remove the specified customer level.
     */
    public function destroy(CustomerLevel $customerLevel): JsonResponse
    {
        $customerLevel->delete();

        Cache::forget('customer_levels.active');

        return response()->json([
            'success' => true,
            'message' => 'Customer level deleted successfully',
        ]);
    }
}
