<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_type'            => 'required|string|max:255',
            'customer_category'            => 'required|string|max:255',
            'customer_subcategory'            => 'required|string|max:255',
            'customer_level'            => 'required|string|max:255',
            'first_name'            => 'required|string|max:255',
            'middle_name'           => 'required|string|max:255',
            'last_name'             => 'required|string|max:255',
            'title'                 => 'required|string|max:255',
            'gender'                => 'required|string|max:50',
            'nationality'           => 'required|string|max:100',
            'identification_type'   => 'required|string|max:100',
            'identification_number' => 'required|string|max:100',
            'date_of_birth'         => 'required|date',
            'place_of_birth'        => 'required|string|max:255',
            'occupation'            => 'required|string|max:255',
            'education'             => 'required|string|max:255',
            'religion'              => 'required|string|max:255',
            'income'                => 'required|string|max:100',
            'primary_language'      => 'required|string|max:100',
            'address'               => 'required|array',
            'contact'               => 'required|array',
            'contact_person'       => 'required|array',
        ];
    }
}
