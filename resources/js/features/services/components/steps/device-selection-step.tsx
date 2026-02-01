import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceOptionSelector } from '@/features/surveys/components/device-option-selector';
import { AvailableDevice } from '@/hooks/use-available-devices';
import { ArrowLeft, ChevronRight, RouterIcon } from 'lucide-react';

interface DeviceSelectionStepProps {
    formData: {
        serviceType: string;
        withDevice?: boolean;
        selectedDevice?: AvailableDevice | null;
        selectedDeviceInternet?: AvailableDevice | null;
        selectedDeviceVoice?: AvailableDevice | null;
        deviceId?: string | null;
        deviceVoiceId?: string | null;
    };
    onUpdate: (data: Partial<DeviceSelectionStepProps['formData']>) => void;
    onNext: () => void;
    onBack: () => void;
    disabled?: boolean;
}

export function DeviceSelectionStep({ formData, onUpdate, onNext, onBack, disabled = false }: DeviceSelectionStepProps) {
    const isCombo = formData.serviceType === '180427974';
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
                onUpdate({
                    withDevice: false,
                    selectedDeviceInternet: null,
                    selectedDeviceVoice: null,
                    deviceId: null,
                    deviceVoiceId: null,
                });
            } else if (isVoiceOnly) {
                onUpdate({
                    withDevice: false,
                    selectedDeviceVoice: null,
                    deviceVoiceId: null,
                });
            } else {
                onUpdate({
                    withDevice: false,
                    selectedDevice: null,
                    deviceId: null,
                });
            }
        } else {
            onUpdate({ withDevice: true });
        }
    };

    const handleDeviceSelect = (device: AvailableDevice) => {
        onUpdate({
            selectedDevice: device,
            deviceId: device.id,
        });
    };

    const handleInternetDeviceSelect = (device: AvailableDevice) => {
        onUpdate({
            selectedDeviceInternet: device,
            deviceId: device.id,
        });
    };

    const handleVoiceDeviceSelect = (device: AvailableDevice) => {
        onUpdate({
            selectedDeviceVoice: device,
            deviceVoiceId: device.id,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                {/* <div className="flex flex-col items-start gap-2">
                    <h2 className="text-lg font-semibold">
                        Device Information
                    </h2>
                    <div className="text-sm text-gray-500">
                        Buy a device with your plan or use your own device.
                    </div>
                </div> */}
                <div className="mt-4">
                    <DeviceOptionSelector
                        value={formData.withDevice}
                        serviceType={formData.serviceType}
                        onChange={handleDeviceOptionChange}
                        selectedDevice={isVoiceOnly ? null : formData.selectedDevice}
                        selectedDeviceInternet={formData.selectedDeviceInternet}
                        selectedDeviceVoice={formData.selectedDeviceVoice}
                        onDeviceSelect={isVoiceOnly ? undefined : handleDeviceSelect}
                        onInternetDeviceSelect={handleInternetDeviceSelect}
                        onVoiceDeviceSelect={handleVoiceDeviceSelect}
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button variant="outline" onClick={onBack} disabled={disabled} className="flex w-full items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!canProceed() || disabled}
                    className="flex w-full items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
