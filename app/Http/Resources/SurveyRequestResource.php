<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SurveyRequestResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'customer_code'        => $this->customer_code,
            'survey_type'          => $this->survey_type,
            'telecom_region'       => $this->telecom_region,
            'oper_type'            => $this->oper_type,
            'main_offer_id'        => $this->main_offer_id,
            'bandwidth'            => $this->bandwidth,
            'contact_person'       => $this->contact_person,
            'contact_no'           => $this->contact_no,
            'contact_email'        => $this->contact_email,
            'survey_address_info'  => $this->survey_address_info,
            'sec_contact_person'   => $this->sec_contact_person,
            'sec_contact_no'       => $this->sec_contact_no,
            'sec_contact_email'    => $this->sec_contact_email,
            'status'               => $this->status,
            'completed_date'       => $this->completed_date,
            'external_operid'      => $this->external_operid,
            'customer_survey_order_id' => $this->customer_survey_order_id,
            'response_time'        => $this->response_time,
            'created_at'           => $this->created_at,
        ];
    }
}
