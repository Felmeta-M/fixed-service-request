<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SurveyOrder;
use App\Services\CreateOrderService;
use App\Services\Payment\PaymentService;
use App\Services\RsaSignatureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\Logging\AppLogger;
use RuntimeException;

class TelebirrController extends Controller
{

    public function __construct(
        protected readonly CreateOrderService $createOrderService,
        protected readonly PaymentService $paymentService,
        protected readonly RsaSignatureService $rsaSignatureService,
    ) {}

    public function createOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'customerSurveyOrderId' => 'required|exists:survey_orders,customer_survey_order_id',
            ]);

            $surveyOrder = SurveyOrder::where('customer_survey_order_id', $validated['customerSurveyOrderId'])
                ->firstOrFail();

            if (!$surveyOrder->canPay()) {
                return response()->json([
                    'success' => false,
                    // 'message' => 'Payment is not available for this order in its current state.',
                    'message' => 'Your payment has already been processed. No further action is needed.',
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

        AppLogger::payment()->info('Telebirr Callback', ['data' => $data]);

        $payment = Payment::where(
            'merch_order_id',
            $data['merch_order_id']
        )->first();

        if (!$payment) {
            Log::error('Telebirr Callback: Payment Not Found', $data);
            return response()->json(['success' => true]);
        }

        // Record when webhook notification arrived (first arrival only)
        if (is_null($payment->webhook_notified_at)) {
            $payment->update(['webhook_notified_at' => now()]);
        }

        // ✅ Delegate core logic
        $this->paymentService->confirmPayment($payment, $data);

        // Always 200 so Telebirr doesn’t retry
        return response()->json(['success' => true]);
    }
}
