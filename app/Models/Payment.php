<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;
    use LogsActivity;

    /**
     * Payment status constants (separate from survey order status)
     */
    public const STATUS_PENDING = 0;
    public const STATUS_PAID = 1;
    public const STATUS_FAILED = 2;
    public const STATUS_CANCELLED = 3;

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
        'subscription_fee',
        'device_fee',
        'other_related_cost',
        'service_number',
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
        'status' => 'integer',
    ];

    /**
     * Check if payment is paid
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID && !empty($this->trans_id);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopeCanceled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    public function survey_request()
    {
        return $this->belongsTo(SurveyOrder::class, 'customer_survey_order_id', 'customer_survey_order_id');
    }
}
