<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyOrderFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'survey_type'          => 'required|string',
            'main_offer_id'        => 'required|string',
            'customer_code'        => 'nullable|string|max:255',
            'customer_type'        => 'nullable',
            'telecom_region'       => 'nullable|string',
            'oper_type'            => 'nullable|string|in:A,M', // A => new nad M => modify
            'bandwidth'            => 'nullable|string',
            'contact_person'       => 'nullable|string',
            'contact_no'           => 'nullable|string',
            'contact_email'        => 'nullable|email',
            'survey_address_info'  => 'nullable|array',
            'sec_contact_person'   => 'nullable|string',
            'sec_contact_no'       => 'nullable|string',
            'sec_contact_email'    => 'nullable|email',
            'status'               => 'nullable|string',
            'completed_date'       => 'nullable|date',
            'external_operid'       => 'nullable|string',
            'with_device'           => 'nullable|boolean'
        ];
    }
}
