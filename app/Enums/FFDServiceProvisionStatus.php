<?php

namespace App\Enums;

enum FFDServiceProvisionStatus: int
{
    // Vendor subscription order status codes (1-8)
    case Created = 1;
    case Ready = 2;
    case Suspended = 3;
    case Processing = 4;
    case Cancelled = 5;
    case Waiting = 6;
    case Failed = 7;
    case Completed = 8;

    public function label(): string
    {
        return match ($this) {
            self::Created => 'Created',
            self::Ready => 'Ready',
            self::Suspended => 'Suspended',
            self::Processing => 'Processing',
            self::Cancelled => 'Cancelled',
            self::Waiting => 'Waiting Subscription',
            self::Failed => 'Failed',
            self::Completed => 'Completed',
        };
    }

    public static function active(): array
    {
        return [self::Waiting];
    }

    /**
     * Statuses that prevent creating a new service/survey request
     */
    public static function blockedForNewRequest(): array
    {
        return [
            self::Waiting->value,
            self::Processing->value,
        ];
    }

    public static function canCancelSurveyOrder(): array
    {
        return [
            self::Created->value,
            self::Suspended->value,
            self::Waiting->value,
        ];
    }

    public static function options(): array
    {
        return array_column(
            array_map(fn($status) => [$status->value, $status->label()], self::cases()),
            1,
            0
        );
    }

    public static function fromValue(int $value): self
    {
        return self::tryFrom($value) ?? throw new \InvalidArgumentException("Invalid status value: $value");
    }

    public static function fromLabel(string $label): self
    {
        return self::fromValue(array_search($label, self::options()));
    }

    /**
     * Get business-specific label based on context.
     * These are custom labels that differ from the base enum label()
     * to provide more specific information based on order phase and type.
     *
     * @param array $context Context information:
     *   - has_subscription: bool - Whether order has subscription
     *   - is_manual: bool - Whether survey is manual
     *   - device_selected: bool - Whether device is selected (manual surveys)
     *   - has_payment: bool - Whether payment is required
     *   - is_paid: bool - Whether payment is completed
     * @return string Business-specific label
     */
    public function businessLabel(array $context = []): string
    {
        $hasSubscription = $context['has_subscription'] ?? false;
        $isManual = $context['is_manual'] ?? false;
        $deviceSelected = $context['device_selected'] ?? false;
        $hasPayment = $context['has_payment'] ?? false;
        $isPaid = $context['is_paid'] ?? false;

        return match ($this) {
            self::Created => match (true) {
                    $isManual && !$hasSubscription => 'Waiting',
                    default => $this->label(),
                },
            self::Processing => match (true) {
                    $isManual && !$hasSubscription => 'Waiting',
                    default => $this->label(),
                },
            self::Waiting => match (true) {
                    $hasSubscription => 'Order Waiting',
                    $isManual && !$hasSubscription => 'Waiting',
                    !$hasSubscription && $isPaid => 'Paid',
                    !$hasSubscription => 'Waiting Survey',
                    default => $this->label(),
                },
            self::Completed => match (true) {
                    $hasSubscription => 'Order Completed', // Can be changed to "Service Activation" or any other label
                    $isManual && !$deviceSelected && !$hasSubscription => 'Device Selection',
                    $isManual && $deviceSelected && $hasPayment && !$isPaid && !$hasSubscription => 'Pending Payment',
                    $isManual && $deviceSelected && $isPaid && !$hasSubscription => 'Paid',
                    $isManual && $deviceSelected && !$hasPayment && !$hasSubscription => 'Ready',
                    !$isManual && !$hasSubscription && $hasPayment && !$isPaid => 'Pending Payment',
                    !$isManual && !$hasSubscription => 'Survey Completed',
                    default => $this->label(),
                },
            default => $this->label(),
        };
    }

    /**
     * Get all possible business labels for this status.
     * Useful for frontend to know all possible label variations.
     *
     * @return array<string> Array of possible business labels
     */
    public function possibleBusinessLabels(): array
    {
        return match ($this) {
            self::Created => ['Created', 'Waiting'],
            self::Processing => ['Processing', 'Waiting'],
            self::Waiting => ['Waiting Subscription', 'Order Waiting', 'Waiting', 'Paid', 'Waiting Survey'],
            self::Completed => [
                'Completed',
                'Order Completed', // Can be changed to "Service Activation"
                'Survey Completed',
                'Device Selection',
                'Pending Payment',
                'Paid',
                'Ready',
            ],
            default => [$this->label()],
        };
    }
}
