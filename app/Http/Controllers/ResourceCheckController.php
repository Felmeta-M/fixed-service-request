<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResourceCheckRequest;
use App\Models\ResourceCheck;
use App\Services\ResourceCheckService;
use Inertia\Inertia;
use Inertia\Response;

class ResourceCheckController extends Controller
{
    public function index(): Response
    {
        $checks = ResourceCheck::latest()->paginate(10);
        return Inertia::render('ResourceCheck/Index', compact('checks'));
    }

    public function create(): Response
    {
        return Inertia::render('ResourceCheck/Create');
    }

    public function store(StoreResourceCheckRequest $request, ResourceCheckService $service)
    {
        $validated = $request->validated();
        $resources = $service->send($validated);

        $check = ResourceCheck::create([
            ...$validated,
        ]);

        return redirect()->route('resource-checks.index')->with([
            'resources' => $resources,
            'message' => 'Resource check submitted successfully.',
        ]);
    }

    public function show(ResourceCheck $resourceCheck): Response
    {
        return Inertia::render('ResourceCheck/Show', [
            'check' => $resourceCheck
        ]);
    }

    public function edit(ResourceCheck $resourceCheck): Response
    {
        return Inertia::render('ResourceCheck/Edit', [
            'check' => $resourceCheck
        ]);
    }

    public function update(StoreResourceCheckRequest $request, ResourceCheck $resourceCheck)
    {
        $validated = $request->validated();
        $resourceCheck->update($validated);

        return redirect()->route('resource-checks.index')->with('message', 'Resource check updated.');
    }

    public function destroy(ResourceCheck $resourceCheck)
    {
        $resourceCheck->delete();

        return redirect()->route('resource-checks.index')->with('message', 'Resource check deleted.');
    }
}
