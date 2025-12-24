<?php 


enum TicketStatus: string
{
    case PENDING = 'PENDING';
    case IN_PROGRESS = 'IN_PROGRESS';
    case RESOLVED = 'RESOLVED';
    case CLOSED = 'CLOSED';

    public static function active(): array
    {
        return [
            self::PENDING->value,
            self::IN_PROGRESS->value,
        ];
    }
}
