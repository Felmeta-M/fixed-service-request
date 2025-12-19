<?php

namespace App\Models;

use App\Enums\FFDServiceProvisionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SurveyRequest extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $guarded = ['id'];

    protected $dates = ['completed_date'];


    protected $casts = [
        'with_device' => 'boolean',
        // 'status'  => FFDServiceProvisionStatus::class,
    ];

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

    public function payment()
    {
        return $this->hasOne(Payment::class, 'customer_survey_order_id', 'customer_survey_order_id');
    }
}
