<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Http\Resources\SurveyRequestResource;
use App\Models\SurveyRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use App\Services\Survey\SurveyServiceFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SurveyOrderController extends Controller
{
    public function __construct(
        protected SurveyServiceFactory $factory
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SurveyRequest::query()->with(['payment']);

        if (!$request->has('customer_code')) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide customer code.',
            ], 404);
        }

        $query->where('customer_code', $request->input('customer_code'))->whereNull('deleted_at');

        $surveyRequests = $query->latest()->paginate(10);

        return SurveyRequestResource::collection($surveyRequests);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SurveyOrderFormRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $service = $this->factory->make($data['main_offer_id']);

            return $service->create($data);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Please correct the highlighted errors.',
                'errors'  => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found.',
            ], Response::HTTP_NOT_FOUND);
        } catch (QueryException $e) {
            $sqlState = $e->errorInfo[0] ?? null;

            return match ($sqlState) {
                // PostgreSQL unique violation
                '23505' => response()->json([
                    'success' => false,
                    'message' => 'This record already exists.',
                ], Response::HTTP_CONFLICT),

                // Foreign key violation
                '23503' => response()->json([
                    'success' => false,
                    'message' => 'This action is not allowed because related data exists.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY),

                // Not null / check constraint
                '23502', '23514' => response()->json([
                    'success' => false,
                    'message' => 'Invalid or incomplete data provided.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY),

                default => response()->json([
                    'success' => false,
                    'message' => 'Some of the information you entered is not valid. Please review your inputs and try again.',
                ], Response::HTTP_INTERNAL_SERVER_ERROR),
            };
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Please try again later.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request)
    {
        $orderId = $request->input('customer_survey_order_id');

        $query = SurveyRequest::query()->with(['payment']);

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
