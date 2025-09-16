<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\QueryAvailableNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AvailableNumberController extends Controller
{
    public function __construct(protected readonly QueryAvailableNumberService  $queryAvailableNumberService) {}

    public function getAvaiableNumber(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pay_mode'           => 'required',
            'tele_type'          => 'required|integer',
            'need_query_by_dept' => 'required|boolean',
            'res_cnt' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors(),
            ], 422);
        }

        return $this->queryAvailableNumberService->queryAvailableNumbers($validator->validated());
    }
}
