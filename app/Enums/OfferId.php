<?php

namespace App\Enums;

enum OfferId: int
{
    case FixedData = 1457567289;
    case FixedVoice = 1207609454;
    case FixedCombo = 102647257;

    /**
     * Check if the offer ID represents a combo service.
     */
    public function isCombo(): bool
    {
        return $this === self::FixedCombo;
    }

    /**
     * Check if the offer ID represents a voice-only service.
     */
    public function isVoiceOnly(): bool
    {
        return $this === self::FixedVoice;
    }

    /**
     * Check if the offer ID represents a broadband/data service.
     */
    public function isBroadband(): bool
    {
        return $this === self::FixedData;
    }

    /**
     * Get OfferId from integer value, returns null if not found.
     */
    public static function tryFromInt(int $value): ?self
    {
        return self::tryFrom($value);
    }
}
