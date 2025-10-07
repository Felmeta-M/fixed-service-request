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
            'number_line'    => 'required|integer',
            'event_code'     => 'required|string',
            'acc_nbr'       => 'required|string',
            'cust_id'        => 'required|string',
            'cust_name'      => 'required|string',
            'cust_addr'      => 'required|string',
            'longitude'      => 'required|numeric',
            'latitude'       => 'required|numeric',
            'combo_flag'     => 'nullable',
            'bandwidth'     => 'nullable',
            'radius'     => 'required',
        ];
    }
}
