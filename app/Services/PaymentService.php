<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\Payment;
use App\Models\SurveyRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

    public function createOrUpdatePayment(string $customer_survey_order_id, string $service_number, float $amount)
    {
        $customer = Auth::guard('api')->user();
        if (!$customer) return;

        DB::transaction(function () use ($customer_survey_order_id, $service_number, $amount, $customer) {
            // Update service number only if needed
            DB::table('survey_requests')
                ->where('customer_survey_order_id', $customer_survey_order_id)
                ->where('service_number', '!=', $service_number)
                ->update(['service_number' => $service_number]);

            // Payment upsert
            DB::table('payments')->updateOrInsert(
                ['customer_survey_order_id' => $customer_survey_order_id],
                [
                    'service_number' => $service_number,
                    'customer_code'  => $customer->customer_code,
                    'amount'         => $amount,
                    'status'         => FFDServiceProvisionStatus::Pending->value,
                    'updated_at'     => now(),
                    'created_at'     => now(),
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
}
