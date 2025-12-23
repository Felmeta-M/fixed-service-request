<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionRequest;
use App\Services\Subscription\SubscriptionServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;


class SubsriptionController extends Controller
{
    public function __construct(
        protected SubscriptionServiceFactory $factory
    ) {}
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
    public function store(StoreSubscriptionRequest $request)
    {
        try {
            $data = $request->validated();

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

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Please try again later.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
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
