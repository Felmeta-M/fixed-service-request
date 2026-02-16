<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\SurveyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SurveyTypeController extends Controller
{
    private const CACHE_KEY = 'survey_types:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display a listing - cached Query Builder
     */
    public function index()
    {
        $surveyTypes = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('survey_types')
                ->where('status', true)
                ->select(['id', 'name', 'status', 'created_at'])
                ->orderBy('name')
                ->get();
        });

        return response()->json($surveyTypes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'sometimes|boolean',
        ]);
        $surveyType = SurveyType::create($validated);

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json($surveyType, 201);
    }

    public function show(SurveyType $surveyType)
    {
        return response()->json($surveyType);
    }

    public function update(Request $request, SurveyType $surveyType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'sometimes|boolean',
        ]);
        $surveyType->update($validated);

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json($surveyType);
    }

    public function destroy(SurveyType $surveyType)
    {
        $surveyType->delete();

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
