<?php

namespace App\Enums;

enum FFDServiceProvisionStatus: string
{
    case Waiting    = 'waiting';
    case Completed  = 'completed';
    case Subscribed = 'subscribed';
    case Reserved   = 'reserved';
    case Released   = 'released';
    case Canceled   = 'canceled';
    case Pending    = 'pending';
    case Paid       = 'paid';
    case Rejected   = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Waiting    => 'Survey waiting',
            self::Completed  => 'Survey completed',
            self::Canceled   => 'Survey canceled',
            self::Subscribed => 'Service subscribed',
            self::Reserved   => 'Service number reserved',
            self::Released   => 'Service number released',
            self::Pending    => 'Payment pending',
            self::Paid       => 'Payment completed',
            self::Rejected   => 'Payment rejected',
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
