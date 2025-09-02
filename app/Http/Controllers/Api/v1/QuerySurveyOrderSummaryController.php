<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuerySurveyOrderSummaryRequest;
use App\Services\QuerySurveyOrderSummery;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuerySurveyOrderSummaryController extends Controller
{
    public function __construct(protected readonly QuerySurveyOrderSummery $querySurveyOrderSummery) {}

    public function querySurveyOrderSummary(QuerySurveyOrderSummaryRequest $querySurveyOrderSummaryRequest)
    {
        $validated = $querySurveyOrderSummaryRequest->validated();
        try {
            return $this->querySurveyOrderSummery->querySurveyOrderSummary($validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\SoapFault $e) {
            return response()->json([
                'success' => false,
                'message' => 'SOAP request failed',
                'error'   => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            // Catch-all for unexpected errors
            \Log::error('SurveyOrderSummary error', [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
            ], 500);
        }
    }
}
