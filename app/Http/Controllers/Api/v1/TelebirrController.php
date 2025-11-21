<?php

namespace App\Http\Controllers\Api\v1;


use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SurveyRequest;
use App\Services\CreateOrderService;
use App\Services\PaymentService;
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
                'customerCode' => 'required|string',
                'customerSurveyOrderId' => 'required|string',
                'amount' => 'required|numeric',
            ]);

            $rawRequest = $this->createOrderService->createOrder($validated);

            return response()->json([
                'success' => true,
                'rawRequest' => $rawRequest,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function notify(Request $request)
    {
        // Log raw request for debugging (optional)
        Log::info('Telebirr Notification Received', $request->all());

        // Validate required fields
        $data = $request->validate([
            'merch_code' => 'required',
            'merch_order_id' => 'required',
            'payment_order_id' => 'required',
            'total_amount' => 'required',
            'trans_id' => 'required',
            'trade_status' => 'required'
        ]);

        // Lookup the payment by your internal order ID
        $payment = Payment::where('merch_order_id', $data['merch_order_id'])->first();

        if (!$payment) {
            Log::error("Telebirr Callback Error: Order not found: " . $data['merch_order_id']);
            return; // no return json, just exit
        }

        // 🛑 Idempotency: Skip if already processed
        if ($payment->status === 'paid') {
            Log::info("Telebirr Duplicate Callback Ignored for order: " . $payment->merch_order_id);
            return; // ignore duplicate hits
        }

        // Process payment
        if ($data['trade_status'] === 'Completed') {
            $payment->update([
                'status' => 'paid',
                'transaction_id' => $data['trans_id'],
                'amount' => $data['total_amount'],
            ]);

            // Update related survey order
            SurveyRequest::query()
                ->where('customer_survey_order_id', $payment->customer_survey_order_id)
                ->update([
                    'status' => FFDServiceProvisionStatus::Paid
                ]);

            Log::info("Telebirr Payment Completed: Order " . $payment->merch_order_id);

        } else {

            $payment->update(['status' => 'failed']);

            Log::warning("Telebirr Payment Failed: Order " . $payment->order_id);
        }
    }

}
