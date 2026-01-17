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

    // ==========================================
    // Query Scopes
    // ==========================================

    /**
     * Scope: Orders that block new requests for a customer.
     */
    public function scopeBlockedForNewRequest($query, string $customerCode)
    {
        return $query->where('customer_code', $customerCode)
            ->whereIn('status', FFDServiceProvisionStatus::blockedForNewRequest());
    }

    /**
     * Scope: Orders that need status refresh.
     */
    public function scopeNeedsRefresh($query, int $minutesThreshold = 5)
    {
        return $query->where('status', FFDServiceProvisionStatus::Waiting->value)
            ->where(function ($q) use ($minutesThreshold) {
                $q->whereNull('last_checked_at')
                    ->orWhere('last_checked_at', '<', now()->subMinutes($minutesThreshold));
            });
    }

    // ==========================================
    // Permission Methods - Single Source of Truth
    // Static methods contain the logic, instance methods are wrappers
    // ==========================================

    public function canPay(): bool
    {
        $p = $this->payment;
        return self::checkCanPay((int) $this->status, (float) ($p?->total_amount ?? 0), $p?->trans_id);
    }

    public function canSubscribe(): bool
    {
        $p = $this->payment;
        return self::checkCanSubscribe((int) $this->status, (float) ($p?->total_amount ?? 0), $p?->trans_id, $this->customer_subscription_order_id);
    }

    public function canChangeOffer(): bool
    {
        return self::checkCanChangeOffer((int) $this->status, $this->customer_subscription_order_id);
    }

    public function canCancel(): bool
    {
        return self::checkCanCancel((int) $this->status, $this->customer_subscription_order_id, $this->payment?->trans_id);
    }

    public function isPaid(): bool
    {
        $p = $this->payment;
        return self::checkIsPaid($p?->id, (int) ($p?->status ?? 0), $p?->trans_id);
    }

    // ==========================================
    // Static Permission Logic (Single Source of Truth)
    // ==========================================

    /**
     * Completed + payment > 0 + no trans_id yet
     */
    public static function checkCanPay(int $status, float $paymentAmount, ?string $paymentTransId): bool
    {
        return $status === FFDServiceProvisionStatus::Completed->value
            && $paymentAmount > 0
            && empty($paymentTransId);
    }

    /**
     * (Completed + no payment + no subscription) OR (Waiting + paid)
     */
    public static function checkCanSubscribe(int $status, float $paymentAmount, ?string $paymentTransId, ?string $subscriptionOrderId): bool
    {
        return ($status === FFDServiceProvisionStatus::Completed->value && $paymentAmount < 1 && empty($subscriptionOrderId))
            || ($status === FFDServiceProvisionStatus::Waiting->value && $paymentAmount > 0 && !empty($paymentTransId));
    }

    /**
     * Completed + has subscription
     */
    public static function checkCanChangeOffer(int $status, ?string $subscriptionOrderId): bool
    {
        return $status === FFDServiceProvisionStatus::Completed->value && !empty($subscriptionOrderId);
    }

    /**
     * (Completed + no subscription) OR (Waiting + no payment)
     */
    public static function checkCanCancel(int $status, ?string $subscriptionOrderId, ?string $paymentTransId): bool
    {
        return ($status === FFDServiceProvisionStatus::Completed->value && empty($subscriptionOrderId))
            || ($status === FFDServiceProvisionStatus::Waiting->value && empty($paymentTransId));
    }

    /**
     * Has payment + Waiting status + has trans_id
     */
    public static function checkIsPaid(?int $paymentId, int $paymentStatus, ?string $paymentTransId): bool
    {
        return $paymentId && $paymentStatus === FFDServiceProvisionStatus::Waiting->value && !empty($paymentTransId);
    }

    /**
     * Check if order needs status refresh (for raw Query Builder data).
     * For WAITING orders - check if status changed.
     */
    public static function needsRefresh(object $order, int $minutesThreshold = 5): bool
    {
        if ((int) $order->status !== FFDServiceProvisionStatus::Waiting->value) {
            return false;
        }

        if (!empty($order->last_checked_at)) {
            $lastChecked = \Carbon\Carbon::parse($order->last_checked_at);
            if ($lastChecked->diffInMinutes(now()) < $minutesThreshold) {
                return false;
            }
        }

        return true;
    }
}
