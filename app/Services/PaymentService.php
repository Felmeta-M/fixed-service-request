<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\Payment;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentService
{
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
                    'amount' => $data['amount'] ?? 0,
                    'payload' => $data['payload'] ?? [],
                    'status' => $data['status'] ?? FFDServiceProvisionStatus::Pending->value,
                ]
            );
        });
    }

    public function createOrUpdatePayment(string $orderId, float $amount)
    {
        $customer = Auth::guard('otp')->user();

        if ($customer) {
            return Payment::firstOrCreate(
                ['customer_survey_order_id' => $orderId],
                [
                    'customer_code' => $customer->customer_code,
                    'amount' => $amount,
                    'status' => FFDServiceProvisionStatus::Pending->value,
                ]
            );
        }
    }

    /**
     * Retrieve a payment by ID or reference number.
     */
    public function find(string|int $customer_survey_order_id): Payment
    {
        $payment = Payment::select(['customer_survey_order_id', 'amount'])->where('customer_survey_order_id', $customer_survey_order_id)->first();

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
}
