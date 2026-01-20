<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\IncomeLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class IncomeLevelController extends Controller
{
    private const CACHE_KEY = 'income_levels:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display a listing of active income levels - cached Query Builder
     */
    public function index()
    {
        $incomeLevels = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('income_levels')
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
            'data' => $incomeLevels,
        ]);
    }

    /**
     * Store a new income level
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:income_levels,code',
            'label' => 'required|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $incomeLevel = IncomeLevel::create($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $incomeLevel,
        ], 201);
    }

    /**
     * Display the specified income level
     */
    public function show(IncomeLevel $incomeLevel)
    {
        return response()->json([
            'success' => true,
            'data' => $incomeLevel,
        ]);
    }

    /**
     * Update the specified income level
     */
    public function update(Request $request, IncomeLevel $incomeLevel)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:income_levels,code,' . $incomeLevel->id,
            'label' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $incomeLevel->update($validated);

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $incomeLevel,
        ]);
    }

    /**
     * Remove the specified income level
     */
    public function destroy(IncomeLevel $incomeLevel)
    {
        $incomeLevel->delete();

        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Income level deleted successfully',
        ]);
    }
}
