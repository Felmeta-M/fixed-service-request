<?php

namespace App\Enums;

enum FFDServiceProvisionStatus: string
{
    case Waiting   = 'Waiting';
    case Completed = 'Completed';
    case Canceled  = 'Canceled';
    case Pending   = 'pending';
    case Paid      = 'paid';
    case Rejected  = 'rejected';

    /**
     * Human-readable label
     * Completed,Canceled,Waiting
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
