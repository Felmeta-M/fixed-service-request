<?php

namespace App\Services\Payment;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\Payment;
use App\Models\SurveyOrder;
use App\Services\Subscription\SubscriptionServiceFactory;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentService
{

    public function __construct(
        protected SubscriptionServiceFactory $factory
    ) {
    }
    /**
     * Create a new payment record.
     */
    public function create(array $data): Payment
    {
        return DB::transaction(function () use ($data) {
            return Payment::create(
                [
                    'customer_code' => $data['customer_code'],
                    'customer_survey_order_id' => $data['customer_survey_order_id'],
                    'total_amount' => $data['total_amount'] ?? 0,
                    'payload' => $data['payload'] ?? [],
                    'status' => $data['status'] ?? FFDServiceProvisionStatus::Pending->value,
                ]
            );
        });
    }

    public function createOrUpdatePayment(array $data)
    {
        $customer = Auth::guard('api')->user();
        if (!$customer)
            return;

        DB::transaction(function () use ($data, $customer) {

            // DB::table('survey_orders')
            //     ->where('customer_survey_order_id', $data['customer_survey_order_id'])
            //     ->update([
            //         'cable_charge' => $data['cable_charge'],
            //     ]);

            DB::table('payments')->updateOrInsert(
                ['customer_survey_order_id' => $data['customer_survey_order_id']],
                [
                    'service_number' => $data['service_number'],
                    'customer_code' => $customer->customer_code,
                    'total_amount' => $data['total_amount'],
                    'subscription_fee' => $data['subscription_fee'] ?? 0,
                    'cable_charge' => $data['cable_charge'] ?? 0,
                    'device_fee' => $data['device_fee'] ?? 0,
                    'status' => FFDServiceProvisionStatus::Pending->value,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        });
    }

    /**
     * Retrieve a payment by ID or reference number.
     */
    public function find(string|int $customerSurveyOrderId): Payment
    {
        $payment = Payment::query()->where('customer_survey_order_id', $customerSurveyOrderId)->first();

        if (!$payment) {
            throw new ModelNotFoundException('Payment not found.');
        }

        return $payment;
    }

    /**
     * Mark a payment as paid.
     */
    public function markAsPaid(Payment $payment): Payment
    {
        $payment->update(['status' => FFDServiceProvisionStatus::Paid->value]);
        return $payment;
    }

    /**
     * Update a payment’s status or data.
     */
    public function update(Payment $payment, array $data): Payment
    {
        $payment->update($data);
        return $payment->fresh();
    }

    /**
     * Mark a payment as failed.
     */
    public function markAsFailed(Payment $payment): Payment
    {
        $payment->update(['status' => 'failed']);
        return $payment;
    }

    public function confirmPayment(
        Payment $payment,
        array $providerPayload
    ): void {
        // Idempotency guard
        if ($payment->status === FFDServiceProvisionStatus::Paid->value) {
            Log::info('Payment already confirmed, skipping', [
                'order' => $payment->customer_survey_order_id,
            ]);
            return;
        }

        $isCompleted = ($providerPayload['trade_status'] ?? null) === 'Completed';

        DB::transaction(function () use ($payment, $providerPayload, $isCompleted) {

            if ($isCompleted) {
                $payment->update([
                    'status' => FFDServiceProvisionStatus::Paid->value,
                    'trans_id' => $providerPayload['transId'] ?? null,
                    'total_amount' => $providerPayload['total_amount'] ?? $payment->total_amount,
                    'payment_order_id' => $providerPayload['payment_order_id'] ?? null,
                    'payload' => json_encode($providerPayload),
                ]);

                SurveyOrder::where(
                    'customer_survey_order_id',
                    $payment->customer_survey_order_id
                )->update([
                            'status' => FFDServiceProvisionStatus::Paid->value,
                        ]);
            } else {
                $payment->update([
                    'status' => FFDServiceProvisionStatus::Failed->value,
                ]);
            }
        });

        /**
         * 🚀 After commit (safe side effects)
         */
        if ($isCompleted) {
            try {
                $this->serviceSubscription($payment->customer_survey_order_id);
            } catch (\Throwable $e) {
                Log::error('Service subscription failed', [
                    'order_id' => $payment->customer_survey_order_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
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
