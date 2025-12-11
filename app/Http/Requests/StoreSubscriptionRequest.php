<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'offering_id'      => ['required', 'string', 'max:255'],
            'survey_order_id'  => ['required', 'string', 'max:255'],
            'customer_code'    => ['required', 'string', 'max:255'],
            'first_name'       => ['required', 'string', 'max:255'],
            'middle_name'     => ['required', 'string', 'max:255'],
            'last_name'        => ['required', 'string', 'max:255'],
            'enterprise_name'  => ['nullable', 'string', 'max:255'],
            'region'           => ['required', 'string', 'max:255'],
            'city'             => ['required', 'string', 'max:255'],
            'zone'             => ['required', 'string', 'max:255'],
            'wereda'           => ['required', 'string', 'max:255'],
            'kebele'           => ['required', 'string', 'max:255'],
            'house_no'         => ['nullable', 'string', 'max:255'],
            'sms_no'           => ['nullable', 'string', 'max:50'],
            'completed_date'   => 'nullable|date',
            'external_operid'  => 'nullable|string',
        ];
    }

    /**
     * Customize error response (graceful JSON errors)
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'status'  => 'error',
            'message' => 'Validation failed',
            'errors'  => $validator->errors(),
        ], 422));
    }
}
