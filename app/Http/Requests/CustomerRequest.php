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
            'first_name'            => 'required|string|max:255',
            'middle_name'           => 'required|string|max:255',
            'last_name'             => 'required|string|max:255',
            'title'                 => 'nullable|string|max:255',
            'gender'                => 'nullable|string|max:50',
            'nationality'           => 'nullable|string|max:100',
            'identification_type'   => 'nullable|string|max:100',
            'identification_number' => 'nullable|string|max:100',
            'date_of_birth'         => 'nullable|date',
            'place_of_birth'        => 'nullable|string|max:255',
            'occupation'            => 'nullable|string|max:255',
            'education'             => 'nullable|string|max:255',
            'religion'              => 'nullable|string|max:255',
            'income'                => 'nullable|string|max:100',
            'primary_language'      => 'nullable|string|max:100',
            'address'               => 'nullable|array',
            'contact'               => 'nullable|array',
            'contact_persons'       => 'nullable|array',
        ];
    }
}
