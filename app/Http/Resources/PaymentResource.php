<?php

namespace App\Http\Resources;

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
            'status'          => $this->status->label(),
            'cable_charge' => $this->cable_charge,
            'subscription_fee' => $this->subscription_fee,
            'device_price' => $this->device_fee,
            'total_amount'          => $this->total_amount,
            'service_number' => $this->service_number,
            // 'created_at' => $this->created_at?->format('Y-m-d'),
        ];
    }
}
