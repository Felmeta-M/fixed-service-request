<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LanguageController extends Controller
{
    /**
     * Display a listing of active languages.
     */
    public function index(): JsonResponse
    {
        $languages = Cache::remember('languages.active', 3600, function () {
            return Language::active()
                ->ordered()
                ->get()
                ->map(function ($language) {
                    return [
                        'value' => $language->code,
                        'label' => $language->name,
                    ];
                });
        });

        return response()->json([
            'success' => true,
            'data' => $languages,
        ]);
    }

    /**
     * Display a listing of all languages (for admin).
     */
    public function all(): JsonResponse
    {
        $languages = Language::ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $languages,
        ]);
    }

    /**
     * Store a newly created language.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:languages,code',
            'name' => 'required|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $language = Language::create($validated);

        Cache::forget('languages.active');

        return response()->json([
            'success' => true,
            'data' => $language,
            'message' => 'Language created successfully',
        ], 201);
    }

    /**
     * Display the specified language.
     */
    public function show(Language $language): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $language,
        ]);
    }

    /**
     * Update the specified language.
     */
    public function update(Request $request, Language $language): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:languages,code,' . $language->id,
            'name' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $language->update($validated);

        Cache::forget('languages.active');

        return response()->json([
            'success' => true,
            'data' => $language,
            'message' => 'Language updated successfully',
        ]);
    }

    /**
     * Remove the specified language.
     */
    public function destroy(Language $language): JsonResponse
    {
        $language->delete();

        Cache::forget('languages.active');

        return response()->json([
            'success' => true,
            'message' => 'Language deleted successfully',
        ]);
    }
}
