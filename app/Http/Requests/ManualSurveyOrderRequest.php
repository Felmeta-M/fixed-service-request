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
            'survey_address_info' => ['required', 'array'],
            'survey_address_info.latitude' => ['required', 'numeric'],
            'survey_address_info.longitude' => ['required', 'numeric'],
            'bandwidth' => ['required', 'string', 'filled'],
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
            'survey_address_info' => 'survey address info',
            'survey_address_info.latitude' => 'latitude',
            'survey_address_info.longitude' => 'longitude',
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'survey_type.in' => 'The survey type must be a valid survey type code (e.g., EIC08).',
            'main_offer_id.in' => 'Invalid service type for manual survey.',
            'bandwidth.required' => 'The bandwidth is required.',
            'survey_address_info.required' => 'The survey address info is required.',
            'survey_address_info.array' => 'The survey address info must be an array.',
            'survey_address_info.latitude.required' => 'The latitude is required.',
            'survey_address_info.latitude.numeric' => 'The latitude must be a number.',
            'survey_address_info.longitude.required' => 'The longitude is required.',
            'survey_address_info.longitude.numeric' => 'The longitude must be a number.',
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
