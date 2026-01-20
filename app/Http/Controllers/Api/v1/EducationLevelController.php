<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EducationLevelController extends Controller
{
    private const CACHE_KEY = 'education_levels:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display a listing of active education levels - cached Query Builder
     */
    public function index()
    {
        $educationLevels = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('education_levels')
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
            'data' => $educationLevels,
        ]);
    }

    /**
     * Store a new education level
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:education_levels,code',
            'label' => 'required|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $educationLevel = EducationLevel::create($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $educationLevel,
        ], 201);
    }

    /**
     * Display the specified education level
     */
    public function show(EducationLevel $educationLevel)
    {
        return response()->json([
            'success' => true,
            'data' => $educationLevel,
        ]);
    }

    /**
     * Update the specified education level
     */
    public function update(Request $request, EducationLevel $educationLevel)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:education_levels,code,' . $educationLevel->id,
            'label' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $educationLevel->update($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $educationLevel,
        ]);
    }

    /**
     * Remove the specified education level
     */
    public function destroy(EducationLevel $educationLevel)
    {
        $educationLevel->delete();

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Education level deleted successfully',
        ]);
    }
}
