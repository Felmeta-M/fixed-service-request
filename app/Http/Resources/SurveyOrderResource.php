<?php

namespace App\Http\Resources;

use App\Helpers\BandwidthHelper;
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
            'fbb_service_number' => $this->fbb_service_number,
            // Backend is single source of truth - return formatted for display
            'bandwidth' => BandwidthHelper::format($this->bandwidth),
            'bandwidth_raw' => $this->bandwidth, // Raw KB value for debugging/API use
            'status'   => $this->status,
            'with_device' => (bool) $this->with_device,
            'survey_is_manual' => $this->survey_is_manual,
            'created_at' => $this->created_at?->format('Y-m-d'),
            'payment' => new PaymentResource($this->payment),
        ];
    }
}
