<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscriber extends Model
{
    protected $fillable = [
        'transaction_id',
        'customer_survey_order_id',
        'customer_code',
        'payment_type',
        'bill_cycle',
        'ethio_zone_or_region',
        'collection_center',
        'account_language',
        'first_name',
        'middle_or_father_name',
        'last_name',
        'enterprise_customer_name',
        'credit_class',
        'administrative_region_city',
        'subcity_zone',
        'wereda_town',
        'kebele',
        'house_no',
        'sms_no',
        'payment_mode',
        'account_ext_params',
        'business_code',
        'external_sequence',
        'network_type',
        'sub_type',
        'sub_language',
        'offering_id',
        'effective_mode',
        'sla_priority',
        'call_center_access',
        'external_operid',
        'installment_completed_date',
        'request_xml'
    ];

    protected $casts = [
        'account_ext_params' => 'array',
    ];
}
