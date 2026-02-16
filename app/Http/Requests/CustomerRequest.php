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
            // ============================================================
            // BACKEND-ONLY FIELDS (NOT accepted from frontend)
            // These are set automatically in CustomerService::buildXml():
            //   - customer_type: '1' (Residential)
            //   - customer_category: '1'
            //   - customer_subcategory: '1'
            //   - customer_level: '8' (Copper)
            // ============================================================
            
            // ============================================================
            // OPTIONAL FIELDS WITH BACKEND DEFAULTS
            // Frontend can send these, but backend has defaults if omitted
            // ============================================================
            'title' => 'nullable|string|max:255',                // Default: '1' (Mr.)
            'nationality' => 'nullable|string|max:100',          // Default: '1231' (Ethiopian)
            'identification_type' => 'nullable|string|max:100',  // Default: '2' (National ID)
            'primary_language' => 'nullable|string|max:100',     // Default: '2060' (Amharic)
            'income' => 'nullable|string|max:100',               // Default: '6'
            'place_of_birth' => 'nullable|string|max:255',       // Default: ''
            
            // ============================================================
            // REQUIRED FIELDS - Must be provided by frontend
            // ============================================================
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|string|max:50',
            'identification_number' => 'required|string|max:100',
            'date_of_birth' => 'required|date',
            'occupation' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'religion' => 'nullable|string|max:255',
            
            // ============================================================
            // ADDRESS - Required
            // ============================================================
            'address' => 'required|array',
            'address.region' => 'required|string|max:255',
            'address.zone' => 'required|string|max:255',
            'address.woreda' => 'required|string|max:255',
            'address.city' => 'nullable|string|max:255',
            'address.street_name' => 'nullable|string|max:255',
            'address.kebele' => 'nullable|string|max:255',
            'address.house_no' => 'nullable|string|max:255',
            
            // ============================================================
            // CONTACT - Mobile required, others optional with defaults
            // ============================================================
            'contact' => 'nullable|array',
            'contact.email' => 'nullable|email',
            'contact.notification_mode' => 'nullable|string|max:10', // Default: '1' (SMS)
            'contact.home_no' => 'nullable|min:9|max:20',
            'contact.office_no' => 'nullable|min:9|max:20',
            'contact.mobile_no' => ['nullable', 'regex:/^(\+251|251|0)?(9)\d{8}$/'],
            'contact.fax_no' => 'nullable|string|min:9|max:20',
            
            // ============================================================
            // CONTACT PERSON - Fully optional
            // ============================================================
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
