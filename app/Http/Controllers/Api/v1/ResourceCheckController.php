<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResourceCheckRequest;
use App\Services\ResourceService;
use ResourceResource;

class ResourceCheckController extends Controller
{
    public function __construct(protected readonly ResourceService $resourceService) {}

    public function check(StoreResourceCheckRequest $request)
    {
        try {
            $validated = $request->validated();

            $result = $this->resourceService->check($validated);

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'No resource found or processing failed.'
                ], 404);
            }

            return new ResourceResource($result);
        } catch (\Exception $e) {
            \Log::error('Error in resource check: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while checking the resource.'
            ], 500);
        }
    }
}
