<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTTRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // if ($this->has('access_number')) {
        //     $digits = preg_replace('/\D/', '', $this->access_number);

        //     // Take last 9 digits
        //     if (strlen($digits) >= 9) {
        //         $digits = substr($digits, -9);
        //     }

        //     $this->merge([
        //         'access_number' => $digits,
        //     ]);
        // }

        if ($this->has('mobile_no')) {
            $digits = preg_replace('/\D/', '', $this->mobile_no);

            // Take last 9 digits and prepend 0
            if (strlen($digits) >= 9) {
                $digits = substr($digits, -9);
                $digits = '0' . $digits;
            }

            $this->merge([
                'mobile_no' => $digits,
            ]);
        }
    }

    public function rules(): array
    {
        // |regex:/^0(9|7)\d{8}$/
        // return $this->all();
        return [
            'account_number'   => 'nullable|string',
            'access_number'    => ['required'], //, 'regex:/^0(9)\d{8}$/'
            'contact_person'   => 'required|string',
            'mobile_no'        => 'required',
            'trouble_title'    => 'nullable|string',
            'trouble_reason'   => 'required|string',
            'tt_description'   => [Rule::requiredIf(fn () => $this->input('trouble_reason') === 'other'), 'nullable', 'string'],
            'occurrence_date'  => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'mobile_no.regex' => 'Mobile number must be a valid Ethio Telecom number (09XXXXXXXX).',
            'tt_description.required' => 'Description is required when "Other" is selected.',
        ];
    }
}
