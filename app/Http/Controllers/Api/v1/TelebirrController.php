<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SurveyRequest;
use App\Services\CreateOrderService;
use App\Services\Payment\PaymentService;
use App\Services\RsaSignatureService;
use App\Services\Subscription\SubscriptionServiceFactory;
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
        protected SubscriptionServiceFactory $factory
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
        $data = $request->validate([
            'merch_code'        => 'nullable',
            'merch_order_id'   => 'nullable',
            'payment_order_id' => 'nullable',
            'total_amount'     => 'nullable',
            'transId'         => 'nullable',
            'trade_status'     => 'nullable',
            'sign'           => 'nullable', // enable when signature verification is ready
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

        if (!$payment) {
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

        $isCompleted = $data['trade_status'] === 'Completed';

        DB::transaction(function () use ($payment, $data, $isCompleted) {

            if ($isCompleted) {
                DB::table('payments')
                    ->where('id', $payment->id)
                    ->update([
                        'status'            => FFDServiceProvisionStatus::Paid,
                        'trans_id'          => $data['transId'],
                        'total_amount'      => $data['total_amount'],
                        'payment_order_id'  => $data['payment_order_id'],
                        'payload'           => json_encode($data),
                        'updated_at'        => now(),
                    ]);

                DB::table('survey_requests')
                    ->where('customer_survey_order_id', $payment->customer_survey_order_id)
                    ->update([
                        'status'     => FFDServiceProvisionStatus::Paid,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('payments')
                    ->where('id', $payment->id)
                    ->update([
                        'status'     => FFDServiceProvisionStatus::Failed,
                        'updated_at' => now(),
                    ]);
            }
        });

        // 🚀 AFTER COMMIT (safe place for third-party calls)
        if ($isCompleted) {
            try {
                $this->serviceSubscription($payment->customer_survey_order_id);
            } catch (\Throwable $e) {
                Log::error('Service subscription failed', [
                    'order_id' => $payment->customer_survey_order_id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }



        return response()->json(['success' => true]);
    }

    public function serviceSubscription(string $customerSurveyOrderId): bool
    {
        $record = DB::table('survey_requests as sr')
            ->join('customers as c', 'c.code', '=', 'sr.customer_code')
            ->where('sr.customer_survey_order_id', $customerSurveyOrderId)
            ->orderByDesc('sr.id')
            ->select([
                'sr.customer_code',
                'sr.main_offer_id',
                'c.name',
            ])
            ->first();

        if (!$record) {
            Log::warning('Survey order or customer not found', [
                'customer_survey_order_id' => $customerSurveyOrderId,
            ]);
            return false;
        }

        $data = [
            'survey_order_id' => $customerSurveyOrderId,
            'customer_code'   => $record->customer_code,
            'name'   => trim($record->name),
            'main_offer_id' => $record->main_offer_id,
        ];

        try {
            $service = $this->factory->make($record->main_offer_id);
            $service->create($data);
            return true;
        } catch (\Throwable $e) {
            Log::error('Service subscription failed', [
                'survey_order_id' => $customerSurveyOrderId,
                'main_offer_id'     => $record->main_offer_id,
                'error'           => $e->getMessage(),
            ]);
            return false;
        }
    }
}
