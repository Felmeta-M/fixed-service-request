<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
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
    ) {
    }

    public function createOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'customerSurveyOrderId' => 'required|exists:survey_orders,customer_survey_order_id',
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


    public function serviceSubscription(string $customerSurveyOrderId)
    {
        // $customerSurveyOrderId = $request->get('customerSurveyOrderId');
        $record = DB::table('survey_orders as sr')
            ->join('customers as c', 'c.code', '=', 'sr.customer_code')
            ->where('sr.customer_survey_order_id', $customerSurveyOrderId)
            ->orderByDesc('sr.id')
            ->select([
                'sr.customer_code',
                'sr.main_offer_id',
                'c.name',
                'c.phone_number',
            ])
            ->first();

        // Log::info('record', ['record' => $record]);
        if (!$record) {
            Log::warning('Survey order or customer not found test', [
                'customer_survey_order_id' => $customerSurveyOrderId,
            ]);
            return false;
        }

        $data = [
            'survey_order_id' => $customerSurveyOrderId,
            'customer_code' => $record->customer_code,
            'name' => trim($record->name),
            'main_offer_id' => $record->main_offer_id,
            'sms_no' => $record->phone_number,
        ];

        // Log::info('data', ['data' => $data]);

        try {
            // Call the third-party subscription service
            $service = $this->factory->make($data['main_offer_id']);
            $service->create($data);
            return true;
        } catch (\Throwable $e) {
            Log::error('Service subscription failed', [
                'survey_order_id' => $customerSurveyOrderId,
                'main_offer_id' => $data['main_offer_id'],
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
