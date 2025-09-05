<?php

namespace App\Http\Controllers\Api\v1;

use App\Services\AccountListService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountController
{
    public function __construct(protected readonly AccountListService $AccountListService) {}

    public function getAccount(Request $request)
    {
        $rules = [
            'service_number' => 'required|string|max:16'
        ];

        $validator = Validator::make($request->only('service_number'), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success'  => false,
                'message'  => $validator->errors()->first('service_number'),
            ], 422);
        }

        $serviceNumber = collect($validator->validated())->first();

        return $this->AccountListService->getAccountList($serviceNumber);
    }
}
