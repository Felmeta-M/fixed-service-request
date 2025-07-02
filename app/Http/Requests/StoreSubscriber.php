<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriber extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Customer Busi Order
            'customer_survey_order_id' => 'required|string',
            'customer_code' => 'required|string',

            // Account Info
            'payment_type' => 'required|string',
            'bill_cycle' => 'required|string',
            'ethio_zone_or_region' => 'required|string',
            'collection_center' => 'required|string',
            'account_language' => 'required|string',
            'first_name' => 'required|string',
            'middle_or_father_name' => 'required|string',
            'last_name' => 'required|string',
            'enterprise_customer_name' => 'required|string',
            'credit_class' => 'required|string',
            'administrative_region_city' => 'required|string',
            'subcity_zone' => 'required|string',
            'wereda_town' => 'required|string',
            'kebele' => 'required|string',
            'house_no' => 'required|string',
            'sms_no' => 'required|string',
            'payment_mode' => 'required|string',
            'account_ext_params' => 'nullable|array',

            // Subscriber Info
            'external_sequence' => 'nullable|string',
            'network_type' => 'nullable|string',
            'sub_type' => 'nullable|string',
            'sub_language' => 'nullable|string',
            'offering_id' => 'nullable|string',
            'effective_mode' => 'nullable|string',
            'sla_priority' => 'nullable|string',
            'call_center_access' => 'nullable|string',

            'external_operid' => 'nullable|string',
            'installment_completed_date' => 'nullable|date_format:YmdHis',
        ];
    }
}
