<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Religion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReligionController extends Controller
{
    private const CACHE_KEY = 'religions:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display a listing of active religions - cached Query Builder
     */
    public function index()
    {
        $religions = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('religions')
                ->select(['id', 'code', 'label', 'status', 'sort_order'])
                ->where('status', true)
                ->orderBy('sort_order')
                ->get()
                ->map(function ($item) {
                    return [
                        'label' => $item->label,
                        'value' => $item->code,
                    ];
                });
        });

        return response()->json([
            'success' => true,
            'data' => $religions,
        ]);
    }

    /**
     * Store a new religion
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:religions,code',
            'label' => 'required|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $religion = Religion::create($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $religion,
        ], 201);
    }

    /**
     * Display the specified religion
     */
    public function show(Religion $religion)
    {
        return response()->json([
            'success' => true,
            'data' => $religion,
        ]);
    }

    /**
     * Update the specified religion
     */
    public function update(Request $request, Religion $religion)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:religions,code,' . $religion->id,
            'label' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $religion->update($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $religion,
        ]);
    }

    /**
     * Remove the specified religion
     */
    public function destroy(Religion $religion)
    {
        $religion->delete();

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Religion deleted successfully',
        ]);
    }
}
