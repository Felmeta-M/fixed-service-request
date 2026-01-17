<?php

namespace App\Models;

use App\Enums\FFDServiceProvisionStatus;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;
    use LogsActivity;

    /**
     * Log channel for this model
     */
    protected string $logName = 'payment';

    /**
     * Only log changes to these attributes
     */
    protected array $logOnlyAttributes = [
        'status',
        'total_amount',
        'trans_id',
        'payment_order_id',
    ];

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'customer_code',
        'customer_survey_order_id',
        'customer_subscription_order_id',
        'merch_code',
        'merch_order_id',
        'payment_order_id',
        'trans_id',
        'total_amount',
        'cable_charge',
        'status',
        'service_details',
        'payload',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'status'  => FFDServiceProvisionStatus::class,
    ];


    public function scopePending($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Pending->value);
    }

    public function scopePaid($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Paid->value);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Failed->value);
    }

    public function scopeCanceled($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Cancelled->value);
    }

    public function survey_request()
    {
        return $this->belongsTo(SurveyOrder::class, 'customer_survey_order_id', 'customer_survey_order_id');
    }
}
