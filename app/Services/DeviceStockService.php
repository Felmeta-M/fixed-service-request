<?php

namespace App\Services;

use App\Models\AvailableDevice;
use App\Models\SurveyOrder;
use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Device Stock Management Service
 *
 * Handles stock checking and deduction for devices.
 * Used to protect customers from ordering out-of-stock devices.
 */
class DeviceStockService
{
    /**
     * Check if device has available stock.
     *
     * @param string $deviceId UUID of the device
     * @return bool True if in stock, false otherwise
     */
    public function isInStock(string $deviceId): bool
    {
        $device = AvailableDevice::find($deviceId);

        if (!$device) {
            return false;
        }

        return $device->stock_quantity > 0;
    }

    /**
     * Get current stock quantity for a device.
     *
     * @param string $deviceId UUID of the device
     * @return int Stock quantity (0 if device not found)
     */
    public function getStockQuantity(string $deviceId): int
    {
        $device = AvailableDevice::find($deviceId);

        return $device?->stock_quantity ?? 0;
    }

    /**
     * Validate stock availability before device selection.
     *
     * @param string|null $dataDeviceId Data device ID (for Data/Combo orders)
     * @param string|null $voiceDeviceId Voice device ID (for Voice/Combo orders)
     * @throws RuntimeException If any device is out of stock
     */
    public function validateStock(?string $dataDeviceId, ?string $voiceDeviceId = null): void
    {
        if ($dataDeviceId && !$this->isInStock($dataDeviceId)) {
            $device = AvailableDevice::find($dataDeviceId);
            $deviceName = $device?->name ?? 'Selected device';

            AppLogger::business()->warning('Device out of stock - data device', [
                'device_id' => $dataDeviceId,
                'device_name' => $deviceName,
            ]);

            throw new RuntimeException("{$deviceName} is currently out of stock. Please select another device.");
        }

        if ($voiceDeviceId && !$this->isInStock($voiceDeviceId)) {
            $device = AvailableDevice::find($voiceDeviceId);
            $deviceName = $device?->name ?? 'Selected voice device';

            AppLogger::business()->warning('Device out of stock - voice device', [
                'device_id' => $voiceDeviceId,
                'device_name' => $deviceName,
            ]);

            throw new RuntimeException("{$deviceName} is currently out of stock. Please select another device.");
        }
    }

    /**
     * Deduct stock for devices in a survey order after successful payment.
     *
     * @param string $customerSurveyOrderId The survey order ID
     * @return array Summary of deductions ['data_device' => bool, 'voice_device' => bool]
     */
    public function deductStockForOrder(string $customerSurveyOrderId): array
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $customerSurveyOrderId)->first();

        if (!$surveyOrder) {
            AppLogger::business()->warning('Cannot deduct stock - survey order not found', [
                'customer_survey_order_id' => $customerSurveyOrderId,
            ]);
            return ['data_device' => false, 'voice_device' => false];
        }

        // Skip if customer didn't select a device
        if (!$surveyOrder->with_device) {
            return ['data_device' => false, 'voice_device' => false];
        }

        $result = ['data_device' => false, 'voice_device' => false];

        DB::transaction(function () use ($surveyOrder, &$result) {
            // Deduct data device stock (for Data and Combo orders)
            if ($surveyOrder->device_id) {
                $result['data_device'] = $this->deductStock(
                    $surveyOrder->device_id,
                    $surveyOrder->customer_survey_order_id,
                    'data'
                );
            }

            // Deduct voice device stock (for Voice and Combo orders)
            if ($surveyOrder->device_voice_id) {
                $result['voice_device'] = $this->deductStock(
                    $surveyOrder->device_voice_id,
                    $surveyOrder->customer_survey_order_id,
                    'voice'
                );
            }
        });

        // Clear device cache after stock change
        $this->clearDeviceCache();

        return $result;
    }

    /**
     * Deduct stock for a single device.
     *
     * @param string $deviceId UUID of the device
     * @param string $orderReference Reference for logging
     * @param string $deviceType 'data' or 'voice' for logging
     * @return bool True if deduction successful
     */
    protected function deductStock(string $deviceId, string $orderReference, string $deviceType): bool
    {
        // Use pessimistic locking to prevent race conditions
        $device = AvailableDevice::where('id', $deviceId)
            ->lockForUpdate()
            ->first();

        if (!$device) {
            AppLogger::business()->warning("Device not found for stock deduction", [
                'device_id' => $deviceId,
                'order_reference' => $orderReference,
                'device_type' => $deviceType,
            ]);
            return false;
        }

        if ($device->stock_quantity <= 0) {
            AppLogger::business()->warning("Cannot deduct stock - already at zero", [
                'device_id' => $deviceId,
                'device_name' => $device->name,
                'order_reference' => $orderReference,
                'device_type' => $deviceType,
            ]);
            return false;
        }

        $device->decrement('stock_quantity');

        return true;
    }

    /**
     * Restore stock for a device (e.g., if payment fails or order is cancelled).
     *
     * @param string $deviceId UUID of the device
     * @param string $orderReference Reference for logging
     * @param string $reason Reason for restoration
     * @return bool True if restoration successful
     */
    public function restoreStock(string $deviceId, string $orderReference, string $reason = 'order_cancelled'): bool
    {
        $device = AvailableDevice::find($deviceId);

        if (!$device) {
            return false;
        }

        $previousStock = $device->stock_quantity;
        $device->increment('stock_quantity');

        AppLogger::business()->warning("Device stock restored", [
            'device_id' => $deviceId,
            'device_name' => $device->name,
            'previous_stock' => $previousStock,
            'new_stock' => $device->stock_quantity,
            'order_reference' => $orderReference,
            'reason' => $reason,
        ]);

        // Clear device cache after stock change
        $this->clearDeviceCache();

        return true;
    }

    /**
     * Restore stock for all devices in a survey order.
     *
     * @param string $customerSurveyOrderId The survey order ID
     * @param string $reason Reason for restoration
     * @return array Summary of restorations
     */
    public function restoreStockForOrder(string $customerSurveyOrderId, string $reason = 'order_cancelled'): array
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $customerSurveyOrderId)->first();

        if (!$surveyOrder || !$surveyOrder->with_device) {
            return ['data_device' => false, 'voice_device' => false];
        }

        $result = ['data_device' => false, 'voice_device' => false];

        if ($surveyOrder->device_id) {
            $result['data_device'] = $this->restoreStock(
                $surveyOrder->device_id,
                $customerSurveyOrderId,
                $reason
            );
        }

        if ($surveyOrder->device_voice_id) {
            $result['voice_device'] = $this->restoreStock(
                $surveyOrder->device_voice_id,
                $customerSurveyOrderId,
                $reason
            );
        }

        return $result;
    }

    /**
     * Clear device listing cache after stock changes.
     * Bumps cache version so GET /api/v1/available-devices returns fresh stock.
     */
    protected function clearDeviceCache(): void
    {
        \App\Http\Controllers\Api\v1\AvailableDeviceController::clearCache();
    }
}
