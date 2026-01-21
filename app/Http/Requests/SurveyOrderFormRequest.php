<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyOrderFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ============================================================
            // REQUIRED FIELDS
            // ============================================================
            'main_offer_id' => 'required|string',                        // Service type (voice/data/combo)
            'survey_address_info' => 'required|array',                   // Location info (encrypted from resource check)
            
            // ============================================================
            // OPTIONAL WITH BACKEND DEFAULTS
            // Backend applies defaults in BaseSurveyService/ComboSurveyService
            // ============================================================
            'survey_type' => 'nullable|string',                          // Default: 'EIC08'
            'customer_code' => 'nullable|string|max:255',                // Default: from auth context
            'customer_type' => 'nullable|string',                        // Default: 'residential'
            'telecom_region' => 'nullable|string',                       // Default: from resource area_code
            'oper_type' => 'nullable|string|in:A,M',                     // Default: 'A' (new)
            'bandwidth' => 'nullable|string',                            // Default: '10M' (10 Mbps)
            'contact_person' => 'nullable|string',                       // Default: from customer profile
            'contact_no' => ['nullable', 'regex:/^(\+251|251|0)?(9)\d{8}$/'], // Default: from customer
            'contact_email' => 'nullable|email',                         // Default: from customer
            'external_operid' => 'nullable|string',                      // Default: '512'
            'completed_date' => 'nullable|string',                       // Default: now()
            
            // ============================================================
            // OPTIONAL - NO DEFAULTS NEEDED
            // ============================================================
            'sec_contact_person' => 'nullable|string',
            'sec_contact_no' => 'nullable|string',
            'sec_contact_email' => 'nullable|email',
            'status' => 'nullable|string',
            'with_device' => 'nullable|boolean',                         // Default: false
            'device_id' => 'nullable|uuid|exists:available_devices,id',
            'device_voice_id' => 'nullable|uuid|exists:available_devices,id',
            'survey_is_manual' => 'nullable|boolean',                    // Default: false
        ];
    }
}
