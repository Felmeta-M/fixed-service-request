<?php

namespace App\Models;

use App\Enums\FFDServiceProvisionStatus;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SurveyOrder extends Model
{
    use HasFactory;
    use SoftDeletes;
    use LogsActivity;

    /**
     * Log channel for this model
     */
    protected string $logName = 'business';

    /**
     * Only log changes to these attributes
     */
    protected array $logOnlyAttributes = [
        'status',
        'customer_code',
        'main_offer_id',
        'service_number',
        'with_device',
    ];

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'customer_id',
        'customer_code',
        'customer_survey_order_id',
        'customer_subscription_order_id',
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
        'status',
        'cancel_reason',
        'completed_date',
        'subscribed_at',
        'cable_length',
        'cable_type',
        'cable_charge',
        'lat',
        'long',
        'with_device',
        'device_id',
        'device_voice_id',
        'survey_is_manual',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

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
        return $this->belongsTo(Customer::class, 'customer_code', 'customer_code');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'customer_survey_order_id', 'customer_survey_order_id');
    }

    public function device()
    {
        return $this->belongsTo(AvailableDevice::class, 'device_id');
    }

    public function voiceDevice()
    {
        return $this->belongsTo(AvailableDevice::class, 'device_voice_id');
    }
}
