<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_code'        => 'required|string|max:255',
            'survey_type'          => 'required',
            'telecom_region'       => 'required|string',
            'oper_type'            => 'required|string|in:A,M', // A => new nad M => modify
            'main_offer_id'        => 'required|string',
            'bandwidth'            => 'required|string',
            'contact_person'       => 'required|string',
            'contact_no'           => 'required|string',
            'contact_email'        => 'required|email',
            'survey_address_info'  => 'nullable|array',
            // 'sec_contact_person'   => 'required|string',
            // 'sec_contact_no'       => 'required|string',
            // 'sec_contact_email'    => 'required|email',
            // 'status'               => 'required|string',
            'completed_date'       => 'nullable|date',
            'external_operid'       => 'nullable|string',
        ];
    }
}
