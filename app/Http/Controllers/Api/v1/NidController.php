<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\NidService;
use Illuminate\Http\Request;

class NidController extends Controller
{
    public function __construct(protected readonly NidService $nidService) {}

    public function getOtp(Request $request)
    {
        $data = $request->validate([
            'individualId' => 'required|string|max:255'
        ]);

        return $this->nidService->requestData($data);
    }

    public function getKyc() {}
}
