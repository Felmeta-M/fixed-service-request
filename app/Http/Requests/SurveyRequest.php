<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id'          => 'nullable|exists:customers,id',
            'customer_code'        => 'required|string|max:255',
            'survey_request_number' => 'nullable|string|unique:survey_requests,survey_request_number,' . $this->id,
            'survey_type'          => 'required|in:new,change',
            'telecom_region'       => 'required|string',
            'operation_type'       => 'required|string',
            'main_offer_id'        => 'required|string',
            'bandwidth'            => 'required|string',
            'contact_person'       => 'required|string',
            'contact_no'           => 'required|string',
            'contact_email'        => 'required|email',
            'sec_contact_person'   => 'required|string',
            'sec_contact_no'       => 'required|string',
            'sec_contact_email'    => 'required|email',
            'status'               => 'required|string',
            'completed_date'       => 'required|date',
        ];
    }
}
