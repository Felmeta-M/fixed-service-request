<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Http\Resources\SurveyRequestResource;
use App\Models\SurveyRequest;
use App\Services\SurveyOrderService;
use Illuminate\Http\Request;

class SurveyOrderController extends Controller
{
    public function __construct(protected readonly SurveyOrderService $surveyOrderService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SurveyRequest::query();

        if (!$request->has('customer_code')) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide customer code.',
            ], 404);
        }

        $query->where('customer_code', $request->input('customer_code'))->whereNull('deleted_at');

        $surveyRequests = $query->paginate(10);

        return SurveyRequestResource::collection($surveyRequests);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SurveyOrderFormRequest $surveyRequest)
    {
        return $this->surveyOrderService->createSurveyOrder($surveyRequest->validated());
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request)
    {
        $customerCode = $request->input('customer_code');
        $orderId = $request->input('customer_survey_order_id');

        $query = SurveyRequest::query();

        if ($customerCode) {
            $query->where('customer_code', $customerCode);
        }

        if ($orderId) {
            $query->orWhere('customer_survey_order_id', $orderId);
        }

        $surveyRequest = $query->first();

        if (!$surveyRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        return new SurveyRequestResource($surveyRequest);
    }

    /**
     * Update the specified resource in storage.
     */

    public function update(Request $request)
    {
        $request->validate([
            'customer_code' => 'required|string',
            'customer_survey_order_id' => 'required|string',
            'status' => 'required|string|in:Completed,Canceled,Waiting', // allowed statuses
        ]);

        $customerCode = $request->input('customer_code');
        $orderId = $request->input('customer_survey_order_id');

        $query = SurveyRequest::query();

        if ($customerCode) {
            $query->where('customer_code', $customerCode);
        }

        if ($orderId) {
            $query->orWhere('customer_survey_order_id', $orderId);
        }

        $surveyRequest = $query->first();

        if (!$surveyRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        $surveyRequest->update([
            'status' => $request->status,
            // 'completed_date' => $request->status === 'completed' ? now() : $surveyRequest->completed_date,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Survey request status updated to '{$surveyRequest->status}'.",
            'data' => new SurveyRequestResource($surveyRequest),
        ]);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'customer_code' => 'required|string',
            'customer_survey_order_id' => 'required|string',
        ]);

        $surveyRequest = SurveyRequest::where('customer_code', $request->customer_code)
            ->where('customer_survey_order_id', $request->customer_survey_order_id)
            ->first();

        if (!$surveyRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Survey request not found.',
            ], 404);
        }

        $surveyRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Survey request deleted successfully.',
        ], 204);
    }
}
