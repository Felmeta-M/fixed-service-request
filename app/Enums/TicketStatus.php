<?php

namespace App\Enums;

enum TicketStatus: string
{
    case OPEN = 'open';           // Under-Processing Tickets
    case CONFIRM = 'confirm';     // Waiting for IVR Confirmation
    case CLOSED = 'closed';       // Archived/Completed Tickets

    /**
     * Statuses considered "active" (still being worked on)
     */
    public static function active(): array
    {
        return [
            self::OPEN->value,
            self::CONFIRM->value,
        ];
    }

    /**
     * Statuses considered "completed" (no longer active)
     */
    public static function completed(): array
    {
        return [
            self::CLOSED->value,
        ];
    }

    /**
     * Get display label for status
     */
    public function label(): string
    {
        return match ($this) {
            self::OPEN => 'Under Processing',
            self::CONFIRM => 'Waiting for Confirmation',
            self::CLOSED => 'Closed',
        };
    }

    /**
     * Resolve status from API response (currentActivity + ttStatus)
     *
     * Open TTs:
     *   currentActivity="Customer Complaint Handling", ttStatus="WAITING FOR CHECK-IN" or "CHECK-OUT"
     *
     * Under confirmation TTs (Waiting for Customer confirmation):
     *   currentActivity="Customer Complaint Confirm", ttStatus="WAITING FOR CHECK-IN"
     *
     * Archived / Closed TTs:
     *   - Both empty: currentActivity="", ttStatus=""
     *   - OR currentActivity="Customer Complaint Handling", ttStatus="Cancelled"
     *   - OR currentActivity="Customer Complaint Confirm", ttStatus="Cancelled"
     */
    public static function fromApiResponse(?string $currentActivity, ?string $ttStatus): self
    {
        $currentActivity = trim($currentActivity ?? '');
        $ttStatusNormalized = strtoupper(trim($ttStatus ?? ''));

        // Archived/Closed: both currentActivity and ttStatus empty
        if (empty($currentActivity) && empty($ttStatusNormalized)) {
            return self::CLOSED;
        }

        // Archived/Closed: Cancelled (handle both American and British spellings)
        if (in_array($ttStatusNormalized, ['CANCELLED', 'CANCELED'])) {
            if ($currentActivity === 'Customer Complaint Handling' || $currentActivity === 'Customer Complaint Confirm') {
                return self::CLOSED;
            }
        }

        // Under confirmation TTs: Customer Complaint Confirm + WAITING FOR CHECK-IN
        if ($currentActivity === 'Customer Complaint Confirm' && $ttStatusNormalized === 'WAITING FOR CHECK-IN') {
            return self::CONFIRM;
        }

        // Open TTs: Customer Complaint Handling + WAITING FOR CHECK-IN or CHECK-OUT
        if ($currentActivity === 'Customer Complaint Handling' && in_array($ttStatusNormalized, ['WAITING FOR CHECK-IN', 'CHECK-OUT'])) {
            return self::OPEN;
        }

        // Default: treat as OPEN if we have any activity, otherwise CLOSED
        if (!empty($currentActivity) || !empty($ttStatusNormalized)) {
            return self::OPEN;
        }

        return self::CLOSED;
    }
}
