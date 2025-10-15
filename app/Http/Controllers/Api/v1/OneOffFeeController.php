<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\OneOffFeeService;

class OneOffFeeController extends Controller
{
    public function __construct(protected readonly OneOffFeeService $oneOffFeeService) {}
    public function calculateOneOffFee(Request $request)
    {
        // Validate JSON input
        $validated = $request->validate([
            'business_code' => 'required|string',
            'customer.type' => 'required|integer',
            'customer.category' => 'required|integer',
            'customer.subcategory' => 'required|integer',
            'customer.level' => 'required|integer',
            'customer.nationality' => 'required|integer',
            'customer.id_type' => 'required|integer',
            'sub_order.business_code' => 'required|string',
            'sub_order.external_sequence' => 'required|string',
            'sub_order.service_number' => 'required|string',
            'sub_order.network_type' => 'required|integer',
            'sub_order.sub_type' => 'required|integer',
            'sub_order.offering_id' => 'required|integer',
        ]);

        return $this->oneOffFeeService->calculateOneOffFee($validated);
    }
}
