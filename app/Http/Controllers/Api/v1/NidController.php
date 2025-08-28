<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\NidKycService;
use App\Services\NidOtpService;
use Illuminate\Http\Request;
use Validator;

class NidController extends Controller
{
    public function __construct(
        protected readonly NidOtpService $nidService,
        protected readonly NidKycService $nidKycService
    ) {}

    public function getOtp(Request $request)
    {
        $rules = [
            'individual_id' => 'required|string|max:16'
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success'  => false,
                'message'  => $validator->errors()->first('individual_id'),
            ], 422);
        }

        $data = $validator->validated();
        return $this->nidService->requestData($data);
    }

    public function getKyc(Request $request)
    {
        // Validation rules
        $rules = [
            'individual_id'   => 'required|string|max:16',
            'otp_value'       => 'required|string|max:6',
            'transaction_id'  => 'required|string|max:64',
            'timestamp'  => 'required|string|max:64',
        ];

        // Run validation
        $validator = Validator::make($request->all(), $rules);

        // Handle validation failure
        if ($validator->fails()) {
            return response()->json([
                'success'  => false,
                'message'  => $validator->errors()->first(), // first error message
            ], 422);
        }

        $data = $validator->validated();

        try {
            $response = $this->nidKycService->requestData($data);

            return response()->json([
                'success'  => true,
                'ret_code' => '0',
                'message'  => 'Request successful.',
                'data'     => $response, // service response
            ]);
        } catch (\Exception $e) {
            // Handle service errors gracefully
            return response()->json([
                'success'  => false,
                'ret_code' => '2',
                'message'  => $e->getMessage(),
            ], 500);
        }
    }
}
