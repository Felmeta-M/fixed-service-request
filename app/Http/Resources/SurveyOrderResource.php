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
            // 'customer_code' => $this->customer_code,
            // 'customer_type' => $this->customer_type,
            'survey_type' => $this->survey_type,
            'main_offer_id' => $this->main_offer_id,
            'service_number' => $this->service_number,
            'bandwidth' => $this->bandwidth,
            // 'contact_person' => $this->contact_person,
            // 'contact_no' => $this->contact_no,
            // 'contact_email' => $this->contact_email,
            // 'survey_address_info' => $this->survey_address_info,
            // 'sec_contact_person' => $this->sec_contact_person,
            // 'sec_contact_no' => $this->sec_contact_no,
            // 'sec_contact_email' => $this->sec_contact_email,
            'status'   => $this->status,
            'with_device' => $this->device,
            'survey_is_manual' => $this->survey_is_manual,
            'created_at' => $this->created_at?->format('Y-m-d'),
            // 'subscribed_at' => $this->subscribed_at ? Carbon::parse($this->subscribed_at)->diffForHumans() : $this->subscribed_at,
            'payment' => new PaymentResource($this->payment),
        ];
    }
}
