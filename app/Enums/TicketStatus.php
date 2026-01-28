<?php

namespace App\Enums;

enum TicketStatus: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case RESOLVED = 'resolved';
    case CLOSED = 'closed';
    case CANCELLED = 'cancelled';
    case WAITING_FOR_CHECK_IN = 'waiting for check-in';

    /**
     * Statuses considered "active" (still being worked on)
     */
    public static function active(): array
    {
        return [
            self::PENDING->value,
            self::IN_PROGRESS->value,
            self::WAITING_FOR_CHECK_IN->value,
        ];
    }

    /**
     * Statuses considered "completed" (no longer active)
     */
    public static function completed(): array
    {
        return [
            self::RESOLVED->value,
            self::CLOSED->value,
            self::CANCELLED->value,
        ];
    }
}
