<?php

namespace App\Enums;

/**
 * Media Type from BSS survey response (param 50005)
 * 
 * PON = Fiber (GPON/EPON)
 * COPPER = Copper cable
 * 
 * Critical for device selection - determines which devices are compatible.
 */
enum MediaType: string
{
    case PON = 'PON';
    case COPPER = 'COPPER';

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::PON => 'Fiber (PON)',
            self::COPPER => 'Copper',
        };
    }

    /**
     * Check if this media type supports fiber devices
     */
    public function isFiber(): bool
    {
        return $this === self::PON;
    }

    /**
     * Check if this media type is copper-based
     */
    public function isCopper(): bool
    {
        return $this === self::COPPER;
    }

    /**
     * Get MediaType from BSS param value (50005)
     * Defaults to PON if not provided (auto survey default)
     */
    public static function fromBssValue(?string $value): self
    {
        if ($value === null || $value === '') {
            return self::PON; // Default for auto surveys
        }

        return self::tryFrom(strtoupper($value)) ?? self::PON;
    }
}
