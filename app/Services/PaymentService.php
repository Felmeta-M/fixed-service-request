<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PaymentService
{
    /**
     * Create a new payment record.
     */
    public function create(array $data): Payment
    {
        return DB::transaction(function () use ($data) {
            return Payment::firstOrCreate(
                ['reference_number' => $data['reference_number']],
                [
                    'customer_code'    => $data['customer_code'],
                    'customer_survey_order_id'    => $data['customer_survey_order_id'],
                    'amount'           => $data['amount'],
                    'payload'          => $data['payload'] ?? [],
                    'status'           => $data['status'],
                ]
            );
        });
    }

    /**
     * Retrieve a payment by ID or reference number.
     */
    public function find(string|int $referenceNumber): Payment
    {
        $payment = Payment::query()->where('reference_number', $referenceNumber)->first();

        if (! $payment) {
            throw new ModelNotFoundException('Payment not found.');
        }

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
     * Mark a payment as paid.
     */
    public function markAsPaid(Payment $payment): Payment
    {
        $payment->update(['status' => FFDServiceProvisionStatus::Paid->value]);
        return $payment;
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
