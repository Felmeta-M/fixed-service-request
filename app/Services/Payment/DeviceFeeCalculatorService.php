<?php

namespace App\Services\Payment;

use App\Enums\OfferId;
use App\Models\AvailableDevice;
use App\Models\SurveyOrder;

/**
 * Service responsible for calculating device fees based on service type and device selection.
 * 
 * Device storage logic by service type:
 * - Voice-only (FixedVoice): device_id contains voice device
 * - Broadband (FixedData): device_id contains internet device
 * - Combo (FixedCombo): device_id contains internet device, device_voice_id contains voice device
 */
class DeviceFeeCalculatorService
{
    /**
     * Calculate device fee from a SurveyOrder model.
     *
     * @param SurveyOrder $survey Survey order with device information
     * @return float Total device fee
     */
    public function calculate(SurveyOrder $survey): float
    {
        if (!$survey->with_device) {
            return 0.0;
        }

        return $this->calculateFromIds(
            (int) $survey->main_offer_id,
            $survey->device_id,
            $survey->device_voice_id
        );
    }

    /**
     * Calculate device fee from raw IDs (useful when survey hasn't been persisted yet).
     *
     * @param int $mainOfferId The main offer ID
     * @param string|int|null $deviceId The primary device ID (UUID or int)
     * @param string|int|null $deviceVoiceId The voice device ID for combo services (UUID or int)
     * @return float Total device fee
     */
    public function calculateFromIds(
        int $mainOfferId,
        string|int|null $deviceId,
        string|int|null $deviceVoiceId = null
    ): float {
        $deviceFee = 0.0;

        $offerType = OfferId::tryFromInt($mainOfferId);

        if ($offerType?->isCombo()) {
            // Combo service: device_id is internet, device_voice_id is voice
            $deviceFee += $this->getDevicePrice($deviceId);
            $deviceFee += $this->getDevicePrice($deviceVoiceId);
        } elseif ($offerType?->isVoiceOnly()) {
            // Voice-only service: device_id contains voice device
            $deviceFee += $this->getDevicePrice($deviceId);
        } else {
            // Broadband service (or unknown): device_id contains internet device
            $deviceFee += $this->getDevicePrice($deviceId);
        }

        return $deviceFee;
    }

    /**
     * Get the price of a device by ID.
     *
     * @param string|int|null $deviceId Device ID (UUID or int)
     * @return float Device price or 0 if not found
     */
    private function getDevicePrice(string|int|null $deviceId): float
    {
        if (!$deviceId) {
            return 0.0;
        }

        $device = AvailableDevice::find($deviceId);
        return $device ? (float) $device->price : 0.0;
    }
}
