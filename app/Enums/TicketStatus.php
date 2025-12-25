<?php

namespace App\Enums;

enum TicketStatus: string
{
    case WAITING_FOR_CHECK_IN = 'waiting for check-in';
    case CANCELLED = 'cancelled';

    public static function active(): array
    {
        return [
            self::WAITING_FOR_CHECK_IN->value,
        ];
    }
}
