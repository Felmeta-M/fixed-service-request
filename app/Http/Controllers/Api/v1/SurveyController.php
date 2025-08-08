<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SurveyRequest;
use App\Services\SurveyOrderService;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    public function __construct(protected readonly SurveyOrderService $surveyOrderService) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SurveyRequest $surveyRequest)
    {
        return $this->surveyOrderService->createSurveyOrder($surveyRequest->validated());
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
