<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\NidKycService;
use App\Services\NidOtpService;
use Illuminate\Http\Request;

class NidController extends Controller
{
    public function __construct(
        protected readonly NidOtpService $nidService,
        protected readonly NidKycService $nidKycService
    ) {}

    public function getOtp(Request $request)
    {
        $data = $request->validate([
            'individualId' => 'required|string|max:12'
        ]);

        return $this->nidService->requestData($data);
    }

    public function getKyc(Request $request)
    {
        $data = $request->validate([
            'individualId' => 'required|string|max:12',
            'otp_value' => 'required|string|max:24',
            'transaction_id' => 'required|string|max:64',
        ]);

        return $this->nidKycService->requestData($data);
    }
}
