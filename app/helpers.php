<?php

if (!function_exists('calculate_cable_charge')) {
    function calculate_cable_charge($cableLength, $cableType, $surveyStatus): float
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

        if (in_array($surveyStatus, ['1', '2'])) {
            if ($cableLength <= 500) {
                return 0.0;
            }

            return round($unitPrice * ($cableLength - 500) * 1.3225, 2);
        }

        return 0.0;
    }
}
