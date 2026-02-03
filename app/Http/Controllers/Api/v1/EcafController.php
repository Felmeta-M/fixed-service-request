<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\EcafService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EcafController extends Controller
{
    public function __construct(protected readonly EcafService $ecafService)
    {
    }

    public function upload(Request $request)
    {
        try {
            // ✅ Validate request
            $validated = $request->validate([
                'transaction_id' => 'required|string',
                'photo' => 'required|string',
            ]);

            // ✅ Call ECAF service
            // $response = $this->ecafService->uploadFile($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Upload successful.',
                'data' => [],
            ], Response::HTTP_OK);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Laravel validation error
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\SoapFault $e) {
            // SOAP failure
            Log::error("ECAF SOAP error", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'ECAF service unavailable. Please try again later.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        } catch (\Exception $e) {
            // Catch-all fallback
            Log::error("Unexpected upload error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Something went wrong. Please contact support.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
