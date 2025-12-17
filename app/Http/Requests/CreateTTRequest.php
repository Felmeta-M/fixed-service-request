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
            'access_number' => 'required|string',
            'account_number' => 'nullable|string',
            'contact_person' => 'required|string',
            'mobile_no' => 'required|string',
            'trouble_reason' => 'required|string',
            'tt_description' => 'required|string',
            'occurrence_date' => 'nullable|date',
        ];
    }
}
