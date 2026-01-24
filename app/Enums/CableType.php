<?php

namespace App\Enums;

/**
 * Cable Type from BSS survey response (param 50056)
 * 
 * Used for device selection - determines compatible devices based on cable infrastructure.
 */
enum CableType: int
{
    case Copper = 0;
    case Fiber = 1;
    case EPON = 2;
    case GPON = 3;
    case WithoutSurvey = 5;

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::Copper => 'Copper',
            self::Fiber => 'Fiber',
            self::EPON => 'EPON',
            self::GPON => 'GPON',
            self::WithoutSurvey => 'Without Survey',
        };
    }

    /**
     * Check if this cable type is fiber-based (supports fiber devices)
     */
    public function isFiber(): bool
    {
        return in_array($this, [self::Fiber, self::EPON, self::GPON], true);
    }

    /**
     * Check if this cable type is copper-based
     */
    public function isCopper(): bool
    {
        return $this === self::Copper;
    }

    /**
     * Get CableType from BSS param value (50056)
     * Returns null for invalid values
     */
    public static function fromBssValue(int|string|null $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        return self::tryFrom((int) $value);
    }

    /**
     * Get all fiber-based cable types
     */
    public static function fiberTypes(): array
    {
        return [self::Fiber, self::EPON, self::GPON];
    }
}
