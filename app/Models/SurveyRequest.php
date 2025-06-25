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
        'customer_id',
        'customer_code',
        'survey_request_number',
        'survey_type',
        'telecom_region',
        'operation_type',
        'main_offer_id',
        'bandwidth',
        'contact_person',
        'contact_no',
        'contact_email',
        'sec_contact_person',
        'sec_contact_no',
        'sec_contact_email',
        'status',
        'completed_date',
    ];

    protected $dates = ['completed_date'];


    protected static function booted()
    {
        static::creating(function ($surveyRequest) {
            $surveyRequest->survey_request_number = self::generateUniqueRequestNumber();
        });
    }

    protected static function generateUniqueRequestNumber(): string
    {
        do {
            $number = 'SURV-' . rand(100000, 999999);
        } while (self::where('survey_request_number', $number)->exists());

        return $number;
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
