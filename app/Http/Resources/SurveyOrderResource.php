<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class SurveyOrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'customer_survey_order_id' => $this->customer_survey_order_id,
            'customer_subscription_order_id' => $this->customer_subscription_order_id,
            'survey_type' => $this->survey_type,
            'main_offer_id' => $this->main_offer_id,
            'service_number' => $this->service_number,
            'bandwidth' => $this->bandwidth,
            'status'   => $this->status,
            'with_device' => (bool) $this->with_device,
            'survey_is_manual' => $this->survey_is_manual,
            'created_at' => $this->created_at?->format('Y-m-d'),
            'payment' => new PaymentResource($this->payment),
        ];
    }
}
