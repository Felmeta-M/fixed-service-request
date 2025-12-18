<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\GetCombiningService;
use Illuminate\Http\Request;

class GetCombiningController extends Controller
{
    protected GetCombiningService $getCombiningService;

    public function __construct(GetCombiningService $getCombiningService)
    {
        $this->getCombiningService = $getCombiningService;
    }


    public function show(Request $request)
    {

        $request->validate([
            'service_number' => 'required|string',
        ]);

        return $this->getCombiningService->getByServiceNumber(
            $request->service_number
        );
    }
}
