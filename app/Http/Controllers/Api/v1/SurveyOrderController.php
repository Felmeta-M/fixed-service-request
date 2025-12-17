<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Http\Resources\SurveyRequestResource;
use App\Models\SurveyRequest;
use App\Services\ComboSurveyOrderService;
use App\Services\ResourceService;
use App\Services\DataSurveyOrderService;
use App\Services\FixedVoiceSurveyOrderService;
use App\Services\Survey\SurveyServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SurveyOrderController extends Controller
{
    // public function __construct(
    //     protected readonly DataSurveyOrderService $surveyOrderService,
    //     protected readonly ResourceService $resourceService
    // ) {}

    public function __construct(
        protected SurveyServiceFactory $factory
    ) {}

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

        $surveyRequests = $query->latest()->paginate(10);

        return SurveyRequestResource::collection($surveyRequests);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SurveyOrderFormRequest $request)
    {
        // $validated = $surveyRequest->validated();
        // // Perform resource check
        // $resourceResponse = $this->resourceService->check([
        //     'bandwidth' => $validated['bandwidth'],
        //     'longitude' => $validated['survey_address_info']['longitude'],
        //     'latitude'  => $validated['survey_address_info']['latitude'],
        // ]);
        // $resourceCheck = $resourceResponse->getData(true)['data'] ?? null;
        // if (!$resourceCheck) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Resource check failed. Cannot create survey order.'
        //     ], 422);
        // }
        // // Determine service based on main_offer_id
        // switch ($validated['main_offer_id']) {
        //     case 1457567289: // Fixed Data
        //         $surveyService = new DataSurveyOrderService();
        //         break;

        //     case 1207609454: // Fixed Voice
        //         $surveyService = new FixedVoiceSurveyOrderService();
        //         break;

        //     case 180427974: // Fixed Combo
        //         $surveyService = new ComboSurveyOrderService();
        //         break;

        //     default:
        //         return response()->json([
        //             'success' => false,
        //             'message' => 'Invalid main_offer_id.'
        //         ], 422);
        // }
        // return $surveyService->createSurveyOrder($validated, $resourceCheck);

        $data = $request->validated();

        $service = $this->factory->make($data['main_offer_id']);

        return $service->create($data);
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
