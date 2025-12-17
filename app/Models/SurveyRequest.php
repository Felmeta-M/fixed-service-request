<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SurveyRequest extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'sub',
        'customer_id',
        'customer_code',
        'customer_survey_order_id',
        'main_offer_id',
        'service_number',
        'survey_type',
        'telecom_region',
        'oper_type',
        'customer_type',
        'bandwidth',
        'contact_person',
        'contact_no',
        'contact_email',
        'sec_contact_person',
        'sec_contact_no',
        'sec_contact_email',
        'cancel_reason',
        'status',
        'completed_date',
        'subscribed_at',
        'cable_length',
        'cable_type',
        'lat',
        'long',
    ];

    protected $dates = ['completed_date'];


    protected static function booted()
    {
        static::creating(function ($surveyRequest) {
            // $surveyRequest->customer_survey_order_id = self::generateUniqueRequestNumber();
        });
    }

    protected static function generateUniqueRequestNumber(): string
    {
        do {
            $number = 'SURV-' . rand(100000, 999999);
        } while (self::where('customer_survey_order_id', $number)->exists());

        return $number;
    }

    public function getRouteKeyName(): string
    {
        return 'customer_survey_order_id';
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
