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
            'customer_type' => 'nullable|string|max:255',
            'customer_category' => 'nullable|string|max:255',
            'customer_subcategory' => 'nullable|string|max:255',
            'customer_level' => 'nullable|string|max:255',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'gender' => 'required|string|max:50',
            'nationality' => 'required|string|max:100',
            'identification_type' => 'required|string|max:100',
            'identification_number' => 'required|string|max:100',
            'date_of_birth' => 'required|date',
            'place_of_birth' => 'nullable|string|max:255',
            'occupation' => 'required|string|max:255',
            'education' => 'required|string|max:255',
            'religion' => 'required|string|max:255',
            'income' => 'nullable|string|max:100',
            'primary_language' => 'nullable|string|max:100',
            'address' => 'required|array',
            'contact' => 'required|array',
            'contact.email' => 'nullable|email',
            'contact.notification_mode' => 'nullable|integer',
            'contact.home_no' => 'nullable|min:9|max:20',
            'contact.office_no' => 'nullable|min:9|max:20',
            'contact.mobile_no' => ['nullable', 'regex:/^(\+251|251|0)?(9)\d{8}$/'],
            'contact.fax_no' => 'nullable|string|min:9|max:20',
            'contact_person' => 'nullable|array',
            'contact_person.*.first_name' => 'nullable|string|max:255',
            'contact_person.*.middle_name' => 'nullable|string|max:255',
            'contact_person.*.last_name' => 'nullable|string|max:255',
            'contact_person.*.title' => 'nullable|max:255',
            'contact_person.*.home_no' => 'nullable|min:9|max:20',
            'contact_person.*.office_no' => 'nullable|min:9|max:20',
            'contact_person.*.mobile_no' => 'nullable|min:9|max:10',
            'contact_person.*.fax_no' => 'nullable|min:9|max:20',
        ];
    }
}
