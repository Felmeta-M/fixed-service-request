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
}
