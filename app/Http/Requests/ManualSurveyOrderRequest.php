<?php

namespace App\Http\Requests;

use App\Enums\OfferId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form request for manual survey order creation.
 *
 * Validates all required and optional fields for creating a manual survey order
 * via the BSS IECAF system. main_offer_id must be Fixed Data, Fixed Voice, or Fixed Combo.
 */
class ManualSurveyOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Required fields
            'survey_type' => ['required', 'string', 'in:EIC08,EIC01,EIC02,EIC03,EIC04,EIC05,EIC06,EIC07'],
            'main_offer_id' => [
                'required',
                'string',
                Rule::in([
                    (string) OfferId::FixedData->value,
                    (string) OfferId::FixedVoice->value,
                    (string) OfferId::FixedCombo->value,
                ]),
            ],
            'bandwidth' => ['required', 'string', 'filled'],
            'telecom_region' => ['optional', 'string', 'max:100'],

            // Address information
            'survey_address_info' => ['required', 'array'],
            'survey_address_info.region_city' => ['required', 'string', 'max:10'],
            'survey_address_info.subcity_zone' => ['required', 'string', 'max:10'],
            'survey_address_info.wereda_town' => ['required', 'string', 'max:10'],
            'survey_address_info.kebele' => ['required', 'string', 'max:100'],
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'survey_type' => 'survey type',
            'main_offer_id' => 'main offer ID',
            'bandwidth' => 'bandwidth',
            'telecom_region' => 'telecom region',
            'survey_address_info.region_city' => 'administrative region/city',
            'survey_address_info.subcity_zone' => 'subcity/zone',
            'survey_address_info.wereda_town' => 'wereda/town',
            'survey_address_info.kebele' => 'kebele',
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'survey_type.in' => 'The survey type must be a valid survey type code (e.g., EIC08).',
            'main_offer_id.in' => 'Invalid service type for manual survey. Use Fixed Broadband (1457567289), Fixed Voice (1207609454), or Combo (102647257).',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('survey_type')) {
            $this->merge([
                'survey_type' => strtoupper($this->survey_type),
            ]);
        }
    }
}
