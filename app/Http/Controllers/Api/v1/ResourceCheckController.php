<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResourceCheckRequest;
use App\Services\ResourceService;

class ResourceCheckController extends Controller
{
    public function __construct(protected readonly ResourceService $resourceService) {}

    public function check(StoreResourceCheckRequest $request)
    {
        $validated = $request->validated();

        return $this->resourceService->check($validated);
    }
}
