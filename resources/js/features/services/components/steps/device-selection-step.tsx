import { Button } from '@/components/ui/button';
import { DeviceOptionSelector } from '@/features/surveys/components/device-option-selector';
import { AvailableDevice } from '@/hooks/use-available-devices';
import { useServiceFormStore } from '@/store/service-form-store';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface DeviceSelectionStepProps {
    onNext: () => void;
    onBack: () => void;
    disabled?: boolean;
}

export function DeviceSelectionStep({ onNext, onBack, disabled = false }: DeviceSelectionStepProps) {
    // ── Zustand store ─────────────────────────────────────────────────────
    const formData = useServiceFormStore((s) => s.formData);
    const updateFormData = useServiceFormStore((s) => s.updateFormData);

    const isCombo = formData.serviceType === '102647257';
    const isVoiceOnly = formData.serviceType === '1207609454';

    // Check if device selection is valid for proceeding
    const canProceed = () => {
        // Device option must be selected
        if (formData.withDevice === undefined) {
            return false;
        }

        // If "without device", can proceed
        if (formData.withDevice === false) {
            return true;
        }

        // If "with device", must have selected device(s)
        if (isCombo) {
            // Combo service: need at least one device (internet, voice, or both)
            const hasInternet = !!(formData.selectedDeviceInternet?.id && formData.deviceId);
            const hasVoice = !!(formData.selectedDeviceVoice?.id && formData.deviceVoiceId);
            return hasInternet || hasVoice;
        } else {
            // Single service (broadband or voice): need one device with ID
            if (isVoiceOnly) {
                // Voice service: need voice device with ID
                return !!(formData.selectedDeviceVoice?.id && formData.deviceVoiceId);
            } else {
                // Broadband service: need device with ID
                return !!(formData.selectedDevice?.id && formData.deviceId);
            }
        }
    };

    const handleDeviceOptionChange = (withDevice: boolean) => {
        if (!withDevice) {
            // If switching to "without device", clear all selected devices
            if (isCombo) {
                updateFormData({
                    withDevice: false,
                    selectedDeviceInternet: null,
                    selectedDeviceVoice: null,
                    deviceId: null,
                    deviceVoiceId: null,
                });
            } else if (isVoiceOnly) {
                updateFormData({
                    withDevice: false,
                    selectedDeviceVoice: null,
                    deviceVoiceId: null,
                });
            } else {
                updateFormData({
                    withDevice: false,
                    selectedDevice: null,
                    deviceId: null,
                });
            }
        } else {
            updateFormData({ withDevice: true });
        }
    };

    const handleDeviceSelect = (device: AvailableDevice | null) => {
        updateFormData({
            selectedDevice: device ?? null,
            deviceId: device?.id ?? null,
        });
    };

    const handleInternetDeviceSelect = (device: AvailableDevice | null) => {
        updateFormData({
            selectedDeviceInternet: device ?? null,
            deviceId: device?.id ?? null,
        });
    };

    const handleVoiceDeviceSelect = (device: AvailableDevice | null) => {
        updateFormData({
            selectedDeviceVoice: device ?? null,
            deviceVoiceId: device?.id ?? null,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="mt-4">
                    <DeviceOptionSelector
                        value={formData.withDevice}
                        serviceType={formData.serviceType}
                        onChange={handleDeviceOptionChange}
                        selectedDevice={isVoiceOnly ? null : (formData.selectedDevice ?? null)}
                        selectedDeviceInternet={formData.selectedDeviceInternet}
                        selectedDeviceVoice={formData.selectedDeviceVoice}
                        onDeviceSelect={isVoiceOnly ? undefined : handleDeviceSelect}
                        onInternetDeviceSelect={handleInternetDeviceSelect}
                        onVoiceDeviceSelect={handleVoiceDeviceSelect}
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="mt-2 flex justify-between pt-2">
                <Button variant="outline" onClick={onBack} disabled={disabled} className="flex items-center space-x-2 text-[#068BCC]">
                    <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
                    <span>Back</span>
                </Button>
                <Button onClick={onNext} disabled={!canProceed() || disabled} className="flex items-center space-x-2 bg-primary hover:bg-primary/90">
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
