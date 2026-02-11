<?php

namespace App\Http\Requests;

use App\Enums\OfferId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SurveyOrderFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Parse bandwidth string to Mbps (e.g. "10M" -> 10, "1Gbps" -> 1024).
     */
    protected function bandwidthMbps(?string $value): ?float
    {
        if (blank($value)) {
            return null;
        }
        $value = strtolower(trim($value));
        if (preg_match('/^(\d+)(m|mb|mbps)$/', $value, $m)) {
            return (float) $m[1];
        }
        if (preg_match('/^(\d+)(g|gb|gbps)$/', $value, $m)) {
            return (float) $m[1] * 1024;
        }
        return is_numeric($value) ? (float) $value : null;
    }

    public function rules(): array
    {
        $manualOfferIds = [
            (string) OfferId::FixedData->value,   // 1457567289
            (string) OfferId::FixedVoice->value,  // 1207609454
            (string) OfferId::FixedCombo->value,   // 102647257
        ];

        return [
            // ============================================================
            // REQUIRED FIELDS
            // ============================================================
            'main_offer_id' => [
                'required',
                'string',
                Rule::when(
                    $this->boolean('survey_is_manual'),
                    Rule::in($manualOfferIds),
                    []
                ),
            ],
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
            'bandwidth' => 'required|string|filled',                     // Required: Minimum 7M for all surveys
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

    /**
     * Normalize contact_no so validation accepts numbers with spaces/dashes (e.g. "+251 91 234 5678").
     */
    protected function prepareForValidation(): void
    {
        $contactNo = $this->input('contact_no');
        if (is_string($contactNo) && $contactNo !== '') {
            $digits = preg_replace('/\D/', '', $contactNo);
            if ($digits !== '') {
                $this->merge(['contact_no' => $digits]);
            }
        }
    }

    /**
     * Minimum bandwidth 7 Mbps for all survey orders.
     * Bandwidth is required for all survey orders.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $bandwidth = $this->input('bandwidth');
            
            // Ensure bandwidth is provided and not empty
            if (empty($bandwidth) || trim($bandwidth) === '') {
                $validator->errors()->add(
                    'bandwidth',
                    'Bandwidth is required for survey orders. Please select a bandwidth option.'
                );
                return;
            }

            // Validate minimum bandwidth of 7 Mbps for all survey orders
            $bandwidthMbps = $this->bandwidthMbps($bandwidth);
            if ($bandwidthMbps === null || $bandwidthMbps < 7) {
                $validator->errors()->add(
                    'bandwidth',
                    'Minimum bandwidth is 7 Mbps. Please select 7M or higher.'
                );
            }
        });
    }

    /**
     * Custom messages for manual survey validation.
     */
    public function messages(): array
    {
        return [
            'main_offer_id.in' => 'Invalid service type for manual survey. Please select Fixed Broadband, Fixed Voice, or Combo.',
        ];
    }
}
