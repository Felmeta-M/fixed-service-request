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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                'customerSurveyOrderId' => 'required|exists:survey_requests,customer_survey_order_id',
            ]);

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
        Log::info('Telebirr Notification Received', $request->all());

        $data = $request->validate([
            'merch_code'        => 'nullable',
            'merch_order_id'   => 'nullable',
            'payment_order_id' => 'nullable',
            'total_amount'     => 'nullable',
            'trans_id'         => 'nullable',
            'trade_status'     => 'nullable',
            // 'sign'           => 'nullable', // enable when signature verification is ready
        ]);

        /**
         * (Recommended)
         * Verify Telebirr RSA signature here
         */
        // if (! $this->rsaSignatureService->verify($data)) {
        //     Log::warning('Telebirr Invalid Signature', $data);
        //     return response()->json(['success' => false], 403);
        // }

        $payment = Payment::where('merch_order_id', $data['merch_order_id'])->first();

        if (! $payment) {
            Log::error('Telebirr Callback: Payment Not Found', [
                'merch_order_id' => $data['merch_order_id'],
            ]);

            // Always return 200 so Telebirr doesn’t retry forever
            return response()->json(['success' => true]);
        }

        /**
         * Idempotency guard
         */
        if ($payment->status === FFDServiceProvisionStatus::Paid) {
            Log::info('Telebirr Duplicate Callback Ignored', [
                'order' => $payment->merch_order_id,
            ]);

            return response()->json(['success' => true]);
        }

        DB::transaction(function () use ($payment, $data) {

            if ($data['trade_status'] === 'Completed') {

                $payment->update([
                    'status'          => FFDServiceProvisionStatus::Paid,
                    'transaction_id'  => $data['trans_id'],
                    'amount'          => $data['total_amount'],
                ]);

                SurveyRequest::where(
                    'customer_survey_order_id',
                    $payment->customer_survey_order_id
                )->update([
                    'status' => FFDServiceProvisionStatus::Paid,
                ]);

                Log::info('Telebirr Payment Completed', [
                    'order' => $payment->merch_order_id,
                    'trans_id' => $data['trans_id'],
                ]);
            } else {

                $payment->update([
                    'status' => FFDServiceProvisionStatus::Failed,
                ]);

                Log::warning('Telebirr Payment Failed', [
                    'order' => $payment->merch_order_id,
                    'status' => $data['trade_status'],
                ]);
            }
        });

        return response()->json(['success' => true]);
    }
}
