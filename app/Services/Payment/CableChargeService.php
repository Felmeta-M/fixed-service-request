<?php

namespace App\Services\Payment;

class CableChargeService
{
    /**
     * Unit prices per cable type.
     *
     * @var array<int, float>
     * 0 copper, 1 fiber, 2 EPON, 3 GPON, 5 without survey
     */
    protected array $unitPrices = [
        0 => 13,
        1 => 45,
        2 => 45,
        3 => 45,
    ];

    /**
     * Calculate cable charge. Customer pays only for the difference over 500 m (first 500 m free).
     *
     * @param float|int|null $cableLength Total cable length in meters (BSS 2147)
     * @param int|string|null $cableType 0=copper, 1=fiber, 2=EPON, 3=GPON
     * @return float Charge in birr (0 if length <= 500)
     */
    public function calculate(?float $cableLength, $cableType): float
    {
        if (empty($cableLength) || empty($cableType)) {
            return 0.0;
        }

        $cableLength = (float) $cableLength;
        $unitPrice = $this->unitPrices[(int) $cableType] ?? 0;

        if ($cableLength <= 500) {
            return 0.0;
        }

        // Charge only for meters over 500: (length - 500) * unit price * factor
        return round($unitPrice * ($cableLength - 500) * 1.3225, 2) ?? 0.0;
    }
}
