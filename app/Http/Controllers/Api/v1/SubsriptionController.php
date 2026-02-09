<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionRequest;
use App\Models\SurveyOrder;
use App\Services\Subscription\SubscriptionServiceFactory;
use App\Services\ApiResponse;
use App\Support\CustomerContext;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;


class SubsriptionController extends Controller
{
    public function __construct(
        protected SubscriptionServiceFactory $factory
    ) {
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     * Ensures users can only subscribe to their own survey orders (authorization check).
     */
    public function store(StoreSubscriptionRequest $request)
    {
        try {
            $data = $request->validated();

            $surveyOrder = SurveyOrder::where('customer_survey_order_id', $data['survey_order_id'])
                ->first();

            if (!$surveyOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey order not found.',
                ], 404);
            }

            // Authorization check: Ensure the authenticated user owns this survey order
            $authenticatedCustomerCode = CustomerContext::code();
            if ($authenticatedCustomerCode && $surveyOrder->customer_code !== $authenticatedCustomerCode) {
                Log::warning('Unauthorized subscription attempt', [
                    'authenticated_customer_code' => $authenticatedCustomerCode,
                    'survey_order_customer_code' => $surveyOrder->customer_code,
                    'survey_order_id' => $data['survey_order_id'],
                ]);

                return ApiResponse::unauthorized(
                    'You are not authorized to subscribe to this survey order. You can only subscribe to your own orders.'
                );
            }

            if (!$surveyOrder->canSubscribe()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subscription is not available for this order in its current state.',
                ], 422);
            }

            $service = $this->factory->make($data['offering_id']);

            return $service->create($data);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Please correct the highlighted errors.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found.',
            ], Response::HTTP_NOT_FOUND);
        } catch (QueryException $e) {
            $sqlState = $e->errorInfo[0] ?? null;

            return match ($sqlState) {
                '22003' => response()->json([
                    'success' => false,
                    'message' => 'A numeric value you entered is too large. Please check and try again.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY),

                '23505' => response()->json([
                    'success' => false,
                    'message' => 'This record already exists.',
                ], Response::HTTP_CONFLICT),

                default => response()->json([
                    'success' => false,
                    'message' => 'Some of the information you entered is invalid. Please review and try again.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY),
            };
        } catch (Throwable $e) {
            // Optional: log for developers
            \Log::error('Subscription store error', [
                'exception' => $e,
                'data' => $data ?? [],
            ]);

            return \App\Services\ApiResponse::safeError(
                $e,
                'Subscription creation failed. Please try again later.'
            );
        }
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
