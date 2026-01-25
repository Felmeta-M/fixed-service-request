<?php

namespace App\Models;

use App\Enums\FFDServiceProvisionStatus;
use App\Enums\OfferId;
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
        'fbb_service_number',
        'internet_account',
        'internet_password',
        'survey_type',
        'telecom_region',
        'area_code',
        'area_name',
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
        'media_type',
        'line_indicator',
        'survey_failure_reason',
        'lat',
        'long',
        'with_device',
        'device_id',
        'device_voice_id',
        'survey_is_manual',
        'zone_code',
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
        'survey_is_manual' => 'boolean',
        'main_offer_id' => 'integer',
        'line_indicator' => 'integer',
        'status' => 'integer',
        // 'media_type' => \App\Enums\MediaType::class,
        // 'cable_type' => \App\Enums\CableType::class,
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

    public function canContinue(): bool
    {
        return self::checkCanContinue(
            (int) $this->status,
            (bool) $this->survey_is_manual,
            $this->with_device,
            $this->customer_subscription_order_id,
            $this->survey_failure_reason,
            $this->media_type
        );
    }

    public function canPay(): bool
    {
        $p = $this->payment;
        return self::checkCanPay(
            (int) $this->status,
            (float) ($p?->total_amount ?? 0),
            $p?->trans_id,
            $this->customer_subscription_order_id,
            (bool) $this->survey_is_manual,
            $this->with_device
        );
    }

    public function canSubscribe(): bool
    {
        $p = $this->payment;
        return self::checkCanSubscribe(
            (int) $this->status,
            (float) ($p?->total_amount ?? 0),
            $p?->trans_id,
            $this->customer_subscription_order_id,
            (bool) $this->survey_is_manual,
            $this->with_device
        );
    }

    public function canChangeOffer(): bool
    {
        return self::checkCanChangeOffer((int) $this->status, $this->customer_subscription_order_id);
    }

    public function canCancel(): bool
    {
        return self::checkCanCancel((int) $this->status, $this->customer_subscription_order_id, $this->payment?->trans_id);
    }

    public function canTerminate(): bool
    {
        return self::checkCanTerminate((int) $this->status, $this->customer_subscription_order_id);
    }

    public function isPaid(): bool
    {
        $p = $this->payment;
        return self::checkIsPaid((int) ($p?->status ?? 0), $p?->trans_id);
    }

    // ==========================================
    // Static Permission Logic (Single Source of Truth)
    // ==========================================

    /**
     * Can continue (device selection) only if:
     * - Survey is MANUAL
     * - Status is Completed (survey finished successfully)
     * - No subscription order yet
     * - Device not yet selected (with_device is null)
     * - No failure reason (survey was successful)
     * - Media type is present (required for device filtering)
     */
    public static function checkCanContinue(
        int $status,
        bool $isManualSurvey,
        ?bool $withDevice,
        ?string $subscriptionOrderId,
        ?string $surveyFailureReason,
        ?string $mediaType
    ): bool {
        // Only for manual surveys
        if (!$isManualSurvey) {
            return false;
        }

        // Already subscribed - no need to continue
        if (!empty($subscriptionOrderId)) {
            return false;
        }

        // Device already selected - no need to continue
        if ($withDevice !== null) {
            return false;
        }

        // Survey failed - cannot continue
        if (!empty($surveyFailureReason)) {
            return false;
        }

        // Media type is required for device selection
        if (empty($mediaType)) {
            return false;
        }

        // Only completed surveys can continue to device selection
        return $status === FFDServiceProvisionStatus::Completed->value;
    }

    /**
     * Can pay only if:
     * - Status is Completed
     * - Payment amount > 0
     * - No trans_id yet (not already paid)
     * - No subscription order yet
     * - For manual surveys: device must be selected first (with_device is not null)
     */
    public static function checkCanPay(
        int $status,
        float $paymentAmount,
        ?string $paymentTransId,
        ?string $subscriptionOrderId,
        bool $isManualSurvey = false,
        ?bool $withDevice = null
    ): bool {
        // Already subscribed - payment phase is done
        if (!empty($subscriptionOrderId)) {
            return false;
        }

        // Already paid
        if (!empty($paymentTransId)) {
            return false;
        }

        // No payment needed
        if ($paymentAmount <= 0) {
            return false;
        }

        // Manual survey: must have device selected first
        if ($isManualSurvey && $withDevice === null) {
            return false;
        }

        // Must be completed to pay
        return $status === FFDServiceProvisionStatus::Completed->value;
    }

    /**
     * Can subscribe only if:
     * - No subscription order yet
     * - For manual surveys: device must be selected first (with_device is not null)
     * - Either: (Completed + free service) OR (Completed + paid)
     */
    public static function checkCanSubscribe(
        int $status,
        float $paymentAmount,
        ?string $paymentTransId,
        ?string $subscriptionOrderId,
        bool $isManualSurvey = false,
        ?bool $withDevice = null
    ): bool {
        // Already subscribed - can't subscribe again
        if (!empty($subscriptionOrderId)) {
            return false;
        }

        // Manual survey: must have device selected first
        if ($isManualSurvey && $withDevice === null) {
            return false;
        }

        // Must be completed status
        if ($status !== FFDServiceProvisionStatus::Completed->value) {
            return false;
        }

        // Free service: no payment required
        if ($paymentAmount < 1) {
            return true;
        }

        // Paid service: must have paid already
        return !empty($paymentTransId);
    }

    /**
     * Completed + has subscription
     */
    public static function checkCanChangeOffer(int $status, ?string $subscriptionOrderId): bool
    {
        return $status === FFDServiceProvisionStatus::Completed->value && !empty($subscriptionOrderId);
    }

    /**
     * Can cancel survey order if:
     * - Survey is Completed but NOT yet subscribed (no subscription order ID)
     * - Has not been paid yet (no trans_id) OR payment can be refunded
     */
    public static function checkCanCancel(int $status, ?string $subscriptionOrderId, ?string $paymentTransId): bool
    {
        // Cannot cancel if already subscribed - use terminate instead
        if (!empty($subscriptionOrderId)) {
            return false;
        }

        // Can cancel completed surveys that haven't been subscribed yet
        return $status === FFDServiceProvisionStatus::Completed->value;
    }

    /**
     * Can terminate service if:
     * - Service has been subscribed (has subscription order ID)
     * - Subscription is Completed (fully provisioned)
     */
    public static function checkCanTerminate(int $status, ?string $subscriptionOrderId): bool
    {
        // Must have a subscription to terminate
        if (empty($subscriptionOrderId)) {
            return false;
        }

        // Can only terminate completed subscriptions
        return $status === FFDServiceProvisionStatus::Completed->value;
    }

    /**
     * Has payment + Waiting status + has trans_id
     */
    public static function checkIsPaid(?int $paymentStatus, ?string $paymentTransId): bool
    {
        return $paymentStatus === Payment::STATUS_PAID && !empty($paymentTransId);
    }

    /**
     * Check if order needs status refresh (for raw Query Builder data).
     * For WAITING orders - check if status changed.
     */
    public static function needsRefresh(object $order, int $minutesThreshold = 5): bool
    {
        $status = (int) $order->status;

        if (
            in_array($status, [
                FFDServiceProvisionStatus::Waiting->value,
                FFDServiceProvisionStatus::Processing->value
            ], true)
        ) {
            return true;
        }

        if (
            in_array($status, [
                FFDServiceProvisionStatus::Failed->value,
                FFDServiceProvisionStatus::Cancelled->value,
            ], true)
        ) {
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
