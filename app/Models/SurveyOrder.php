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
        'voice_service_number',
        'data_service_number',
        'with_device',
        'customer_survey_order_id',
        'customer_subscription_order_id',
        'completed_date',
        'subscribed_at',
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
        'transaction_id',
        'main_offer_id',
        'voice_service_number',
        'data_service_number',
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
        'other_related_cost',
        'media_type',
        'line_indicator',
        'survey_failure_reason',
        'latitude',
        'longitude',
        'customer_latitude',
        'customer_longitude',
        'with_device',
        'device_id',
        'device_voice_id',
        'device_offer_id',
        'device_voice_offer_id',
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
        return $this->belongsTo(Customer::class, 'customer_code', 'code');
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
            ->where('survey_is_manual', true)
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

    /**
     * Check for duplicate survey order by customer_code, main_offer_id and survey_type only.
     * Used after ruling out unsubscribed orders (customer_subscription_order_id null).
     *
     * @param string $customerCode
     * @param int $mainOfferId
     * @param string $surveyType
     * @return SurveyOrder|null The duplicate survey order if found, null otherwise
     */
    public static function findDuplicate(
        string $customerCode,
        int $mainOfferId,
        string $surveyType
    ): ?self {
        return self::where('customer_code', $customerCode)
            ->where('main_offer_id', $mainOfferId)
            ->where('survey_type', $surveyType)
            ->whereNull('deleted_at')
            ->first();
    }

    /**
     * Normalize bandwidth value to KB for comparison.
     * 
     * Handles various formats:
     * - String formats: "10M", "10mbps", "1gbps" → converted to KB
     * - Numeric values: assumed to be already in KB
     * - Null values: returned as null
     * 
     * @param string|int|null $bandwidth
     * @return int|null Bandwidth in KB, or null if input is null/empty
     */
    public static function normalizeBandwidthToKb(string|int|null $bandwidth): ?int
    {
        if ($bandwidth === null || $bandwidth === '') {
            return null;
        }

        if (is_string($bandwidth)) {
            // Parse bandwidth string (e.g., "10M", "10mbps", "1gbps") to KB
            $bandwidthLower = strtolower(trim($bandwidth));

            // Handle MB format: "10M", "10mb", "10mbps"
            if (preg_match('/^(\d+)(m|mb|mbps)$/', $bandwidthLower, $matches)) {
                return (int) $matches[1] * 1024; // MB to KB
            }

            // Handle GB format: "1G", "1gb", "1gbps"
            if (preg_match('/^(\d+)(g|gb|gbps)$/', $bandwidthLower, $matches)) {
                return (int) $matches[1] * 1024 * 1024; // GB to KB
            }

            // If numeric string, assume it's already in KB
            if (is_numeric($bandwidth)) {
                return (int) $bandwidth;
            }

            return null;
        }

        // Numeric value - assume already in KB
        return (int) $bandwidth;
    }

    /**
     * Find an existing survey order for the same customer_code, main_offer_id, survey_type
     * where customer_subscription_order_id is null (not yet subscribed).
     * If such an order exists, the customer is not allowed to create another survey order
     * until they complete/subscribe to that one.
     *
     * @param string $customerCode
     * @param int $mainOfferId
     * @param string $surveyType
     * @return SurveyOrder|null
     */
    public static function findUnsubscribedSurveyOrder(
        string $customerCode,
        int $mainOfferId,
        string $surveyType
    ): ?self {
        return self::where('customer_code', $customerCode)
            ->where('main_offer_id', $mainOfferId)
            ->where('survey_type', $surveyType)
            ->whereNull('customer_subscription_order_id')
            ->whereNull('deleted_at')
            ->first();
    }

    /**
     * Validate if a duplicate survey order exists and return validation result.
     *
     * Rules (in order):
     * 1. If customer has an existing survey order (same customer_code, main_offer_id, survey_type)
     *    with customer_subscription_order_id null, they are not allowed to create more until subscribed.
     * 2. Duplicate by customer_code, main_offer_id, survey_type only (no bandwidth or date).
     *
     * @param string $customerCode
     * @param int $mainOfferId
     * @param string $surveyType
     * @return array|null Returns array with 'exists' => true and 'survey_order' if duplicate/unsubscribed found, null otherwise
     */
    public static function validateDuplicate(
        string $customerCode,
        int $mainOfferId,
        string $surveyType
    ): ?array {
        // Rule 1: Customer cannot create more survey orders if they have one with customer_subscription_order_id null
        $unsubscribed = self::findUnsubscribedSurveyOrder($customerCode, $mainOfferId, $surveyType);
        if ($unsubscribed) {
            return [
                'exists' => true,
                'survey_order' => $unsubscribed,
                'message' => 'You already have an active request for this service. Please wait for it to be completed before submitting a new request.',
            ];
        }

        // Rule 2: Duplicate by customer_code, main_offer_id, survey_type only
        // $duplicate = self::findDuplicate($customerCode, $mainOfferId, $surveyType);
        // if ($duplicate) {
        //     return [
        //         'exists' => true,
        //         'survey_order' => $duplicate,
        //         'message' => 'You have already created a survey request for this service type. Please use your existing order.',
        //     ];
        // }

        return null;
    }

    /**
     * Check if customer has a blocked survey order (active/completed orders that prevent new requests).
     * 
     * @param string $customerCode
     * @return bool True if customer has a blocked survey order, false otherwise
     */
    public static function hasBlockedSurvey(string $customerCode): bool
    {
        return self::blockedForNewRequest($customerCode)->exists();
    }

    /**
     * Find survey order by subscription order ID or survey order ID.
     * 
     * @param string|null $subscriptionOrderId
     * @param string|null $surveyOrderId
     * @return SurveyOrder|null
     */
    public static function findByOrderId(?string $subscriptionOrderId, ?string $surveyOrderId): ?self
    {
        if ($subscriptionOrderId) {
            return self::where('customer_subscription_order_id', $subscriptionOrderId)
                ->whereNull('deleted_at')
                ->first();
        }

        if ($surveyOrderId) {
            return self::where('customer_survey_order_id', $surveyOrderId)
                ->whereNull('deleted_at')
                ->first();
        }

        return null;
    }

    /**
     * Scope: Filter by customer code.
     */
    public function scopeForCustomer($query, string $customerCode)
    {
        return $query->where('customer_code', $customerCode);
    }

    /**
     * Scope: Filter by subscription order ID or survey order ID.
     */
    public function scopeByOrderId($query, ?string $subscriptionOrderId, ?string $surveyOrderId)
    {
        if ($subscriptionOrderId) {
            return $query->where('customer_subscription_order_id', $subscriptionOrderId);
        }

        if ($surveyOrderId) {
            return $query->where('customer_survey_order_id', $surveyOrderId);
        }

        return $query->whereRaw('1 = 0'); // Return empty result if neither ID provided
    }

    /**
     * Scope: No subscription order yet (customer_subscription_order_id null or empty).
     * Used by display-status scopes that mirror SurveyOrderController::getStatusLabel().
     */
    public function scopeWithoutSubscription($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('customer_subscription_order_id')
                ->orWhere('customer_subscription_order_id', '');
        });
    }

    /**
     * Scope: Has subscription order.
     * PostgreSQL-friendly: explicit non-null and non-empty (trimmed).
     */
    public function scopeWithSubscription($query)
    {
        return $query->whereNotNull('customer_subscription_order_id')
            ->whereRaw("TRIM(COALESCE(customer_subscription_order_id, '')) != ''");
    }

    // ==========================================
    // Display status scopes (mirror SurveyOrderController::getStatusLabel / getStatusCode)
    // Order of match() in controller: Failed → Cancelled → Order Waiting → Order Completed
    //   → Manual: Waiting, Device Selection, Pending Payment, Paid, Ready
    //   → Auto: Paid, Waiting Survey, Pending Payment, Survey Completed
    // ==========================================

    public function scopeDisplayStatusFailed($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Failed->value);
    }

    public function scopeDisplayStatusCancelled($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Cancelled->value);
    }

    public function scopeDisplayStatusOrderWaiting($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Waiting->value)
            ->withSubscription();
    }

    /**
     * Order Completed: status Completed + has subscription.
     * Matches controller getStatusLabel(): status Completed && !empty(customer_subscription_order_id).
     * Effective SQL: status = ? AND customer_subscription_order_id IS NOT NULL AND customer_subscription_order_id <> ''.
     */
    public function scopeDisplayStatusOrderCompleted($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Completed->value)
            ->whereNotNull('customer_subscription_order_id');
    }

    /** Manual survey: in progress (Created, Waiting, Processing), no subscription */
    public function scopeDisplayStatusWaiting($query)
    {
        return $query->where('survey_is_manual', true)
            ->whereIn('status', [
                FFDServiceProvisionStatus::Created->value,
                FFDServiceProvisionStatus::Waiting->value,
                FFDServiceProvisionStatus::Processing->value,
            ])
            ->withoutSubscription();
    }

    /** Manual: Completed, device not selected, no subscription */
    public function scopeDisplayStatusDeviceSelection($query)
    {
        return $query->where('survey_is_manual', true)
            ->where('status', FFDServiceProvisionStatus::Completed->value)
            ->whereNull('with_device')
            ->withoutSubscription();
    }

    /** Pending Payment: (manual + device selected + has payment + not paid) OR (auto + completed + has payment + not paid) */
    public function scopeDisplayStatusPendingPayment($query)
    {
        $hasPayment = fn($q) => $q->where('total_amount', '>', 0);
        $notPaid = fn($q) => $q->where(function ($q2) {
            $q2->whereNull('trans_id')->orWhere('trans_id', '');
        });

        return $query->withoutSubscription()
            ->where(function ($q) use ($hasPayment, $notPaid) {
                $q->where(function ($q2) use ($hasPayment, $notPaid) {
                    $q2->where('survey_is_manual', true)
                        ->where('status', FFDServiceProvisionStatus::Completed->value)
                        ->whereNotNull('with_device')
                        ->whereHas('payment', $hasPayment)
                        ->whereHas('payment', $notPaid);
                })->orWhere(function ($q2) use ($hasPayment, $notPaid) {
                    $q2->where('survey_is_manual', false)
                        ->where('status', FFDServiceProvisionStatus::Completed->value)
                        ->whereHas('payment', $hasPayment)
                        ->whereHas('payment', $notPaid);
                });
            });
    }

    /** Paid: (manual + completed + device + isPaid) OR (auto: Waiting + isPaid) */
    public function scopeDisplayStatusPaid($query)
    {
        $isPaid = fn($q) => $q->whereNotNull('trans_id')->where('trans_id', '!=', '');

        return $query->withoutSubscription()
            ->where(function ($q) use ($isPaid) {
                $q->where(function ($q2) use ($isPaid) {
                    $q2->where('survey_is_manual', true)
                        ->where('status', FFDServiceProvisionStatus::Completed->value)
                        ->whereNotNull('with_device')
                        ->whereHas('payment', $isPaid);
                })->orWhere(function ($q2) use ($isPaid) {
                    $q2->where('status', FFDServiceProvisionStatus::Waiting->value)
                        ->whereHas('payment', $isPaid);
                });
            });
    }

    /** Manual: Completed + device selected + no payment required (free), no subscription. */
    public function scopeDisplayStatusReady($query)
    {
        return $query->where('survey_is_manual', true)
            ->where('status', FFDServiceProvisionStatus::Completed->value)
            ->whereNotNull('with_device')
            ->withoutSubscription()
            ->whereDoesntHave('payment', fn($q) => $q->where('total_amount', '>', 0));
    }

    /** Auto: Waiting, no subscription, not paid (survey in progress) */
    public function scopeDisplayStatusWaitingSurvey($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Waiting->value)
            ->withoutSubscription()
            ->where(function ($q) {
                $q->whereDoesntHave('payment')
                    ->orWhereHas('payment', fn($q2) => $q2->whereNull('trans_id')->orWhere('trans_id', ''));
            });
    }

    /** Auto: Completed, no subscription, and (no payment required or already paid) */
    public function scopeDisplayStatusSurveyCompleted($query)
    {
        return $query->where('survey_is_manual', false)
            ->where('status', FFDServiceProvisionStatus::Completed->value)
            ->withoutSubscription()
            ->where(function ($q) {
                $q->whereDoesntHave('payment')
                    ->orWhereHas('payment', fn($q2) => $q2->where('total_amount', '<=', 0))
                    ->orWhereHas('payment', fn($q2) => $q2->whereNotNull('trans_id')->where('trans_id', '!=', ''));
            });
    }

    // ==========================================
    // Permission Methods - Single Source of Truth
    // Static methods contain the logic, instance methods are wrappers
    // ==========================================

    /**
     * Get the same display status label used for customer-facing API (index/status).
     * Single source of truth for "Order Waiting", "Survey Completed", "Pending Payment", etc.
     */
    public function getDisplayStatusLabel(): string
    {
        $statusEnum = FFDServiceProvisionStatus::tryFrom((int) ($this->status ?? 0));
        if ($statusEnum === null) {
            return 'Unknown';
        }

        $hasSubscription = !empty($this->customer_subscription_order_id);
        $p = $this->payment;
        $paymentAmount = (float) ($p?->total_amount ?? 0);
        $paymentTransId = $p?->trans_id ?? null;
        $isPaid = !empty($paymentTransId);
        $hasPayment = $paymentAmount > 0;

        $rawManual = $this->survey_is_manual ?? false;
        $isManual = $rawManual === true || $rawManual === 't' || $rawManual === 1 || $rawManual === '1';

        $rawWithDevice = $this->with_device ?? null;
        $deviceSelected = $rawWithDevice !== null;

        $context = [
            'has_subscription' => $hasSubscription,
            'is_manual' => $isManual,
            'device_selected' => $deviceSelected,
            'has_payment' => $hasPayment,
            'is_paid' => $isPaid,
        ];

        return $statusEnum->businessLabel($context);
    }

    /**
     * Filament badge color for display status (matches customer-facing status meaning).
     */
    public function getDisplayStatusColor(): string
    {
        $label = $this->getDisplayStatusLabel();
        return match ($label) {
            'Order Completed', 'Survey Completed', 'Paid', 'Ready' => 'success',
            'Failed' => 'danger',
            'Cancelled' => 'gray',
            'Order Waiting', 'Waiting', 'Waiting Survey', 'Device Selection', 'Pending Payment', 'Processing' => 'warning',
            default => 'primary',
        };
    }

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
     * - OR: Waiting status with payment already made (allows manual subscription when
     *       third-party activation failed but customer has paid)
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

        // Allow subscription if:
        // 1. Completed status (normal flow), OR
        // 2. Waiting status with payment already made (third-party activation failed but paid)
        $isCompleted = $status === FFDServiceProvisionStatus::Completed->value;
        $isWaitingWithPayment = $status === FFDServiceProvisionStatus::Waiting->value
            && !empty($paymentTransId);

        if (!$isCompleted && !$isWaitingWithPayment) {
            return false;
        }

        // If waiting with payment, allow manual subscription
        if ($isWaitingWithPayment) {
            return true;
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
