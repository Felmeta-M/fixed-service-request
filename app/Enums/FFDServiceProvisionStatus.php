<?php

namespace App\Enums;

enum FFDServiceProvisionStatus: int
{
    case Created    = 0;
    case Processing = 1;
    case Suspended  = 2;
    case Waiting    = 3;
    case Failed     = 4;
    case Completed  = 5;
    case Ready      = 6;
    case Cancelled  = 9;
    case Pending    = 10;
    case Paid       = 11;
    case Refund     = 13;

    public function label(): string
    {
        return match ($this) {
            self::Created    => 'Created',
            self::Processing => 'Processing',
            self::Suspended  => 'Suspended',
            self::Waiting    => 'Waiting',
            self::Failed     => 'Failed',
            self::Completed  => 'Completed',
            self::Ready      => 'Ready',
            self::Cancelled  => 'Cancelled',
            self::Pending    => 'Pending',
            self::Paid       => 'Paid',
            self::Refund     => 'Refund',
        };
    }

    public static function options(): array
    {
        return array_column(
            array_map(fn($status) => [$status->value, $status->label()], self::cases()),
            1,
            0
        );
    }
}
