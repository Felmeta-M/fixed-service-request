<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\EcafService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EcafController extends Controller
{
    public function __construct(protected readonly EcafService $ecafService) {}

    public function upload(Request $request)
    {
        try {
            // ✅ Validate request
            $validated = $request->validate([
                'transaction_id' => 'required|string',
                'cust_type'      => 'required|integer',
                'cust_code'      => 'required|string',
                'first_name'     => 'required|string',
                'last_name'      => 'required|string',
                'images'         => 'required|array',
                'images.*.type'  => 'required|integer',
                'images.*.file'  => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
            ]);

            // ✅ Convert images to base64
            $images = [];
            foreach ($request->file('images') as $index => $file) {
                try {
                    $images[] = [
                        'type'    => $request->input("images.$index.type"),
                        'content' => $this->ecafService->imageToBase64($file),
                    ];
                } catch (\Exception $e) {
                    Log::error("Image conversion failed", [
                        'file' => $file->getClientOriginalName(),
                        'error' => $e->getMessage(),
                    ]);

                    return response()->json([
                        'status'  => 'error',
                        'message' => "Failed to process image at index {$index}.",
                    ], Response::HTTP_BAD_REQUEST);
                }
            }

            $data = $request->except('images');

            // ✅ Call ECAF service
            $response = $this->ecafService->uploadFile($data, $images);

            return response()->json([
                'status'  => 'success',
                'message' => 'Upload successful.',
                'data'    => $response,
            ], Response::HTTP_OK);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Laravel validation error
            return response()->json([
                'status'  => 'error',
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\SoapFault $e) {
            // SOAP failure
            Log::error("ECAF SOAP error", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'ECAF service unavailable. Please try again later.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        } catch (\Exception $e) {
            // Catch-all fallback
            Log::error("Unexpected upload error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Something went wrong. Please contact support.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
