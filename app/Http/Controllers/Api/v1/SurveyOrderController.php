<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Http\Resources\SurveyOrderResource;
use App\Models\SurveyOrder;
use App\Services\QuerySurveyOrderService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use App\Services\Survey\SurveyServiceFactory;
use FFI;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class SurveyOrderController extends Controller
{
    public function __construct(
        protected SurveyServiceFactory $factory,
        protected readonly QuerySurveyOrderService $querySurveyOrderService

    ) {}

    /**
     * Display a listing of the resource.
     */

    public function index(Request $request)
    {
        try {
            $customer = auth()->user();

            $query = SurveyOrder::query()
                ->with(['payment'])
                ->where('customer_code', $customer->customer_code)
                ->whereNull('deleted_at');

            if ($request->filled('survey_order_no')) {
                $query->where('survey_order_no', 'like', '%' . $request->survey_order_no . '%');
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $surveyOrders = $query->latest()->paginate(10);

            /** Refresh only WAITING survey orders */
            foreach ($surveyOrders as $order) {
                try {
                    if ($order->status !== FFDServiceProvisionStatus::Waiting->value) {
                        continue;
                    }

                    $this->refreshSurveyOrder($order);
                } catch (\Throwable $e) {
                    Log::warning('Failed to refresh survey order', [
                        'survey_order_no' => $order->survey_order_no ?? null,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return SurveyOrderResource::collection($surveyOrders);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch survey orders', [
                'customer_code' => $request->customer_code ?? null,
                'error' => $e->getMessage(),
            ]);

            return SurveyOrderResource::collection(collect());
        }
    }


    protected function refreshSurveyOrder(SurveyOrder $order): void
    {
        // Throttle
        if ($order->last_checked_at && $order->last_checked_at->diffInMinutes(now()) < 5) {
            return;
        }

        // Only WAITING orders go to third-party
        if ($order->status !== FFDServiceProvisionStatus::Waiting->value) {
            return;
        }

        try {
            $response = $this->querySurveyOrderService
                ->querySurveyOrderDetail($order->customer_survey_order_id);
        } catch (\Throwable $e) {
            Log::error('Survey order API call failed', [
                'survey_order_no' => $order->survey_order_no,
                'error' => $e->getMessage(),
            ]);
            return;
        }

        if (empty($response['success']) || empty($response['status'])) {
            return;
        }

        $newStatus = $response['status'];

        if ($order->status !== $newStatus) {
            $order->update([
                'status' => $newStatus,
                'last_synced_status' => $newStatus,
            ]);
        }

        $order->update([
            'last_checked_at' => now(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */

    public function store(SurveyOrderFormRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $customer = auth()->user();

            // 🚫 Prevent multiple active survey requests
            $hasBlockedSurvey = SurveyOrder::query()
                ->where('customer_code', $customer?->customer_code)
                ->whereIn('status', FFDServiceProvisionStatus::blockedForNewRequest())
                ->exists();

            if ($hasBlockedSurvey) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active or completed request. Please wait until it is finalized.',
                ], Response::HTTP_CONFLICT);
            }

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
            return response()->json([
                'success' => false,
                'message' => 'Database error occurred.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (Throwable $e) {
            Log::error('SurveyOrder store error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

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

        $query = SurveyOrder::query()->with(['payment']);

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

        return new SurveyOrderResource($surveyRequest);
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

        $query = SurveyOrder::query();

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
            'data' => new SurveyOrderResource($surveyRequest),
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

        $surveyRequest = SurveyOrder::where('customer_code', $request->customer_code)
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
