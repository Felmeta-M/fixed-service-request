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
     * Rules:
     * 1. OPEN: currentActivity="Customer Complaint Handling" AND ttStatus="WAITING FOR CHECK-IN" or "CHECK-OUT"
     * 2. CONFIRM: currentActivity="Customer Complaint Confirm" AND ttStatus="WAITING FOR CHECK-IN"
     * 3. CLOSED: currentActivity="" AND ttStatus="" (Normally Archived)
     * 4. CLOSED: currentActivity="Customer Complaint Handling" AND ttStatus="Canceled" (Manually Canceled)
     */
    public static function fromApiResponse(?string $currentActivity, ?string $ttStatus): self
    {
        $currentActivity = trim($currentActivity ?? '');
        $ttStatus = strtoupper(trim($ttStatus ?? ''));

        // Rule 3 & 4: CLOSED - Empty values or Canceled
        if (empty($currentActivity) && empty($ttStatus)) {
            return self::CLOSED;
        }

        // Handle both spellings: CANCELED (American) and CANCELLED (British)
        if ($currentActivity === 'Customer Complaint Handling' && in_array($ttStatus, ['CANCELED', 'CANCELLED'])) {
            return self::CLOSED;
        }

        // Rule 2: CONFIRM - Waiting for IVR Confirmation
        if ($currentActivity === 'Customer Complaint Confirm' && $ttStatus === 'WAITING FOR CHECK-IN') {
            return self::CONFIRM;
        }

        // Rule 1: OPEN - Under Processing
        if ($currentActivity === 'Customer Complaint Handling' && in_array($ttStatus, ['WAITING FOR CHECK-IN', 'CHECK-OUT'])) {
            return self::OPEN;
        }

        // Default: treat as OPEN if we have any activity
        if (!empty($currentActivity) || !empty($ttStatus)) {
            return self::OPEN;
        }

        return self::CLOSED;
    }
}
