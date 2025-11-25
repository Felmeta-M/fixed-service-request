<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\OneOffFeeService;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class OneOffFeeController extends Controller
{
    public function __construct(
        protected readonly OneOffFeeService $oneOffFeeService,
        protected readonly PaymentService $payment_service,
    ) {}

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
            'sub_order.external_sequence' => 'nullable|string',
            'sub_order.service_number' => 'required|string',
            'sub_order.network_type' => 'required|integer',
            'sub_order.sub_type' => 'required|integer',
            'sub_order.offering_id' => 'required|integer',
        ]);

        $feeResult = $this->oneOffFeeService->calculateOneOffFee($validated);

        if (!($feeResult['success'] ?? false)) {
            //TODO: check run time exection is approparate
            throw new RuntimeException('Failed to calculate fees.');
        }

        $finalAmount = $this->computeTotalFeeAmount($feeResult['data']['fees']);

        //cable cost
        // $cableCost = calculate_cable_charge($cableLength, $cableType, $surveyStatus);
        $this->payment_service->createOrUpdatePayment(
            $request->customer_survey_order_id,
            $finalAmount
        );

        return $feeResult;
    }

    private function computeTotalFeeAmount(array $fees)
    {
        $total = 0;

        foreach ($fees as $fee) {
            $calculated = (int)$fee['calculated_fee'];
            $discount   = (int)$fee['discount_fee'];
            $taxAmount  = 0;

            if (!empty($fee['taxes'])) {
                foreach ($fee['taxes'] as $tax) {
                    $taxAmount += (int)$tax['amount'];
                }
            }

            $total += ($calculated - $discount + $taxAmount);
        }

        return $total / 10000;
    }
}
