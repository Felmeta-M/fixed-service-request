<?php

namespace App\Enums;

enum FFDServiceProvisionStatus: string
{
    case Waiting   = 'waiting';
    case Completed = 'completed';
    case Canceled  = 'canceled';
    case Pending   = 'pending';
    case Paid      = 'paid';
    case Rejected  = 'rejected';

    /**
     * Human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::Waiting   => 'Waiting',
            self::Completed => 'Completed',
            self::Canceled  => 'Canceled',
            self::Pending   => 'Pending',
            self::Paid      => 'Paid',
            self::Rejected  => 'Rejected',
        };
    }

    /**
     * Options for dropdowns: [value => label]
     */
    public static function options(): array
    {
        return [
            self::Waiting->value   => self::Waiting->label(),
            self::Completed->value => self::Completed->label(),
            self::Canceled->value  => self::Canceled->label(),
            self::Pending->value   => self::Pending->label(),
            self::Paid->value      => self::Paid->label(),
            self::Rejected->value  => self::Rejected->label(),
        ];
    }
}
