<?php

namespace App\Http\Resources;

use App\Enums\FFDServiceProvisionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'customer_survey_order_id' => $this->customer_survey_order_id,
            'customer_subscription_order_id' => $this->customer_subscription_order_id,
            'status' => $this->status instanceof FFDServiceProvisionStatus
                ? $this->status->label()
                : (FFDServiceProvisionStatus::tryFrom($this->status)?->label() ?? (string) $this->status),

            'is_paid' => $this->status === FFDServiceProvisionStatus::Paid->value && $this->trans_id !== null,

            'can_pay' => $this->status === FFDServiceProvisionStatus::Completed->value || $this->customer_subscription_order_id === null,
            'can_subscribe' => $this->status === FFDServiceProvisionStatus::Waiting->value || $this->customer_subscription_order_id === null,
            'can_cancel' => $this->customer_subscription_order_id !== null,

            'cable_charge' => $this->cable_charge,
            'subscription_fee' => $this->subscription_fee,
            'device_price' => $this->device_fee,
            'total_amount' => $this->total_amount,
            'service_number' => $this->service_number,
            'created_at' => $this->created_at?->format('Y-m-d'),
        ];
    }
}
