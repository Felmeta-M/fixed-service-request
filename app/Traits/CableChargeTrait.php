<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait CableChargeTrait
{
    /**
     * Calculate cable charge based on length, type, and survey status.
     *
     * @param float|int $cableLength
     * @param string|int $cableType
     * @param string|int $surveyStatus
     * @return float
     */
    public function calculateCableCharge($cableLength, $cableType, string|int $surveyStatus): float
    {
        $unitPrices = [
            '0' => 13,
            '1' => 45,
            '2' => 45,
            '3' => 45,
        ];

        if (empty($cableLength) || empty($cableType)) {
            return 0.0;
        }

        $cableLength = (float) $cableLength;
        $unitPrice = $unitPrices[$cableType] ?? 0;

        if (in_array($surveyStatus, ["5"])) {
            if ($cableLength <= 500) {
                return 0.0;
            }

            return round($unitPrice * ($cableLength - 500) * 1.3225, 2);
        }

        return 0.0;
    }
}
