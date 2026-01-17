<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SurveyOrder;
use App\Services\CreateOrderService;
use App\Services\Payment\PaymentService;
use App\Services\RsaSignatureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class TelebirrController extends Controller
{

    public function __construct(
        protected readonly CreateOrderService $createOrderService,
        protected readonly PaymentService $paymentService,
        protected readonly RsaSignatureService $rsaSignatureService,
    ) {
    }

    public function createOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'customerSurveyOrderId' => 'required|exists:survey_orders,customer_survey_order_id',
            ]);

            // Validate survey status and subscription order ID
            $surveyOrder = SurveyOrder::where('customer_survey_order_id', $validated['customerSurveyOrderId'])
                ->firstOrFail();

            // Fence: Only allow payment for completed surveys without subscription order ID
            if ($surveyOrder->status !== (string) FFDServiceProvisionStatus::Completed->value) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment is only available for completed survey orders.',
                ], 422);
            }

            if ($surveyOrder->customer_subscription_order_id !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment is not available for orders that already have a subscription.',
                ], 422);
            }

            $rawRequest = $this->createOrderService->createOrder($validated);

            return response()->json([
                'success' => true,
                'rawRequest' => $rawRequest,
            ]);
        } catch (RuntimeException $e) {
            Log::error('Telebirr Create Order Error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to create order',
            ], 500);
        }
    }

    public function notify(Request $request)
    {
        $data = $request->validate([
            'merch_order_id' => 'nullable',
            'payment_order_id' => 'nullable',
            'total_amount' => 'nullable',
            'transId' => 'nullable',
            'trade_status' => 'nullable',
            'sign' => 'nullable',
        ]);

        $payment = Payment::where(
            'merch_order_id',
            $data['merch_order_id']
        )->first();

        if (!$payment) {
            Log::error('Telebirr Callback: Payment Not Found', $data);
            return response()->json(['success' => true]);
        }

        // ✅ Delegate core logic
        $this->paymentService->confirmPayment($payment, $data);

        // Always 200 so Telebirr doesn’t retry
        return response()->json(['success' => true]);
    }
}
