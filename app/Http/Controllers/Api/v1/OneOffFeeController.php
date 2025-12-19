<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SurveyRequest;
use App\Services\OneOffFeeService;
use App\Services\PaymentService;
use App\Traits\CableChargeTrait;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OneOffFeeController extends Controller
{
    use CableChargeTrait;

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

        // Calculate one-off fee
        $feeResult = $this->oneOffFeeService->calculateOneOffFee($validated);
        $feeData = $feeResult->getData(true);

        if (!($feeData['success'] ?? false)) {
            // Return the fee result if calculation fails
            return $feeResult;
        }

        $oneOffFee = (int) $this->computeTotalFeeAmount($feeData['data']['fees']);

        // Retrieve survey request
        $surveyRequest = SurveyRequest::query()
            ->where('customer_survey_order_id', $request->customer_survey_order_id)
            ->first();

        if (!$surveyRequest) {
            throw new Exception('Survey request not found');
        }

        $cableCharge = $this->calculateCableCharge($surveyRequest->cable_length, $surveyRequest->cable_type, $surveyRequest->status);

        // Final amount including cable charge
        $totalAmount = $oneOffFee + $cableCharge;

        // Create or update payment
        $data = [
            'customer_survey_order_id' => $request->customer_survey_order_id,
            'service_number' => $surveyRequest->service_number,
            'amount' => $totalAmount,
            'labor_material_transport_cost' =>  $cableCharge,
        ];

        $this->payment_service->createOrUpdatePayment($data);

        return $feeData;
    }


    public function fee(Request $request)
    {
        $validated = $request->validate([
            'customer_survey_order_id' => 'required|string'
        ]);

        $orderId = $validated['customer_survey_order_id'];

        return $this->payment_service->find($orderId);
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
                    if (!empty($tax)) {
                        $taxAmount += (int)$tax['amount'] ?? 0;
                    }
                }
            }

            $total += ($calculated - $discount + $taxAmount);
        }

        return $total / 10000;
    }
}
