<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTTRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_number' => 'nullable|string',
            'access_number' => 'required|string',
            'contact_person' => 'required|string',
            'mobile_no' => 'required|string',
            'trouble_title' => 'required|string',
            'trouble_reason' => 'required|string',
            'tt_description' => 'required|string',
            'occurrence_date' => 'nullable|date',
        ];
    }
}
