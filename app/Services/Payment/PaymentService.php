<?php

namespace App\Services\Payment;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\Payment;
use App\Models\SurveyOrder;
use App\Services\DeviceStockService;
use App\Services\Logging\AppLogger;
use App\Services\Subscription\ServiceActivationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentService
{

    public function __construct(
        protected ServiceActivationService $activationService,
        protected DeviceStockService $deviceStockService,
    ) {}
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
                    'status' => $data['status'] ?? Payment::STATUS_PENDING,
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
                    'other_related_cost' => $data['other_related_cost'] ?? 0,
                    'customer_subscription_order_id' => $data['customer_subscription_order_id'] ?? null,
                    'status' => Payment::STATUS_PENDING,
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
        $payment->update(['status' => Payment::STATUS_PAID]); // Payment status: Paid
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
        $payment->update(['status' => Payment::STATUS_FAILED]);
        return $payment;
    }

    public function confirmPayment(
        Payment $payment,
        array $providerPayload
    ): void {
        // Idempotency guard
        // If we've already recorded a successful payment (and transaction id),
        // skip any side-effects to keep webhook handling idempotent.
        if ($payment->isPaid()) {
            AppLogger::payment()->info('Payment already confirmed, skipping', [
                'order_id' => $payment->customer_survey_order_id,
            ]);
            return;
        }

        $isCompleted = ($providerPayload['trade_status'] ?? null) === 'Completed';

        DB::transaction(function () use ($payment, $providerPayload, $isCompleted) {

            if ($isCompleted) {
                $payment->update([
                    'status' => \App\Models\Payment::STATUS_PAID,
                    'trans_id' => $providerPayload['transId'] ?? null,
                    'total_amount' => $providerPayload['total_amount'] ?? $payment->total_amount,
                    'payment_order_id' => $providerPayload['payment_order_id'] ?? null,
                    'payload' => json_encode($providerPayload),
                ]);

                SurveyOrder::where(
                    'customer_survey_order_id',
                    $payment->customer_survey_order_id
                )->update([
                    'status' => FFDServiceProvisionStatus::Waiting->value,
                ]);
            } else {
                $payment->update([
                    'status' => Payment::STATUS_FAILED,
                ]);
            }
        });

        /**
         * 🚀 After commit (safe side effects)
         */
        if ($isCompleted) {
            AppLogger::payment()->paymentEvent(
                'payment_confirmed',
                $payment->customer_survey_order_id,
                (float) ($providerPayload['total_amount'] ?? $payment->total_amount),
                \App\Models\Payment::STATUS_PAID,
                ['trans_id' => $providerPayload['transId'] ?? null]
            );

            // Deduct device stock after successful payment (for orders with devices)
            $this->deductDeviceStock($payment->customer_survey_order_id);

            // Auto-activate service after successful payment
            // If activation fails, customer can manually subscribe later
            $this->activationService->activate($payment->customer_survey_order_id);
        } else {
            AppLogger::payment()->warning('Payment not completed', [
                'order_id' => $payment->customer_survey_order_id,
                'trade_status' => $providerPayload['trade_status'] ?? 'unknown',
            ]);
        }
    }

    /**
     * Deduct device stock after successful payment.
     * Handles both data devices (device_id) and voice devices (device_voice_id).
     */
    protected function deductDeviceStock(string $customerSurveyOrderId): void
    {
        try {
            $this->deviceStockService->deductStockForOrder($customerSurveyOrderId);
        } catch (\Throwable $e) {
            // Log but don't fail - payment was already successful
            AppLogger::payment()->error('Failed to deduct device stock after payment', [
                'order_id' => $customerSurveyOrderId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
