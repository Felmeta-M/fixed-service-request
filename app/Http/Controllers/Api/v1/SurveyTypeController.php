<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\SurveyType;
use Illuminate\Http\Request;

class SurveyTypeController extends Controller
{
    public function index()
    {
        return response()->json(SurveyType::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $surveyType = SurveyType::create($validated);
        return response()->json($surveyType, 201);
    }

    public function show(SurveyType $surveyType)
    {
        return response()->json($surveyType);
    }

    public function update(Request $request, SurveyType $surveyType)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $surveyType->update($validated);
        return response()->json($surveyType);
    }

    public function destroy(SurveyType $surveyType)
    {
        $surveyType->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
