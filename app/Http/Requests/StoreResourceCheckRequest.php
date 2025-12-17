<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreResourceCheckRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prod_spec_code' => 'required|string',
            'number_line' => 'required|integer',
            'event_code' => 'required|string',
            'acc_nbr' => 'required|string',
            'cust_id' => 'nullable|string',
            'cust_name' => 'required|string',
            'cust_addr' => 'required|string',
            'longitude' => 'numeric|between:33.0,48.2',
            'latitude' => 'numeric|between:3.4,14.9',
            'combo_flag' => 'nullable',
            'bandwidth' => 'nullable',
            'radius' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
            'lat.between'  => 'Latitude must be within the boundaries of Ethiopia.',
            'long.between' => 'Longitude must be within the boundaries of Ethiopia.',
        ];
    }
}
