<?php

namespace App\Services;

class CableChargeService
{
    /**
     * Unit prices per cable type.
     *
     * @var array<int, float>
     */
    protected array $unitPrices = [
        0 => 13,
        1 => 45,
        2 => 45,
        3 => 45,
    ];

    /**
     * Calculate cable charge based on length, type, and survey status.
     *
     * @param float|int|null $cableLength
     * @param int|string|null $cableType
     * @param string|int $surveyStatus
     * @return float
     */
    public function calculate(?float $cableLength, $cableType, string|int $surveyStatus): float
    {
        if (empty($cableLength) || empty($cableType)) {
            return 0.0;
        }

        $cableLength = (float) $cableLength;
        $unitPrice   = $this->unitPrices[(int)$cableType] ?? 0;

        if ((string)$surveyStatus === '5') { // Only for completed surveys
            if ($cableLength <= 500) {
                return 0.0;
            }

            return round($unitPrice * ($cableLength - 500) * 1.3225, 2);
        }

        return 0.0;
    }
}
