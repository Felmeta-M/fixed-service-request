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
            'bandwidth' => 'nullable|string',                            // Auto: min 10M; manual: min 7M
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
     * Auto surveys (non-manual): minimum bandwidth 10 Mbps for Data/Combo.
     * Manual surveys: minimum 7 Mbps (validated in ManualSurveyOrderRequest / default 7M).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->boolean('survey_is_manual')) {
                return;
            }
            $offerId = (string) ($this->input('main_offer_id') ?? '');
            $dataOffer = (string) OfferId::FixedData->value;
            $comboOffer = (string) OfferId::FixedCombo->value;
            if ($offerId !== $dataOffer && $offerId !== $comboOffer) {
                return; // Voice or other: no bandwidth minimum
            }
            $bandwidthMbps = $this->bandwidthMbps($this->input('bandwidth'));
            if ($bandwidthMbps === null || $bandwidthMbps < 10) {
                $validator->errors()->add(
                    'bandwidth',
                    'For this flow, minimum bandwidth is 10 Mbps. Please select 10M or higher.'
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
