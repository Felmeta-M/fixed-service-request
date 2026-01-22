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

    // Voice-only services don't need device selection
    if (isVoiceOnly) {
        // Auto-set without device for voice services and proceed
        if (formData.withDevice === undefined) {
            onUpdate({ withDevice: false });
        }
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RouterIcon className="h-5 w-5 text-primary" />
                            Device Information
                        </CardTitle>
                        <CardDescription>
                            Device selection is not available for Voice-only services.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Voice services do not require a device. You can proceed to the next step.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onBack} disabled={disabled} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} disabled={disabled} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

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
            // Combo service: need internet device with ID
            return !!(formData.selectedDeviceInternet?.id);
        } else {
            // Single service (broadband): need one device with ID
            return !!(formData.selectedDevice?.id && formData.deviceId);
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RouterIcon className="h-5 w-5 text-primary" />
                        Device Information
                    </CardTitle>
                    <CardDescription>
                        Choose whether you want to purchase a device with your service or use your own compatible device.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DeviceOptionSelector
                        value={formData.withDevice}
                        serviceType={formData.serviceType}
                        onChange={handleDeviceOptionChange}
                        selectedDevice={formData.selectedDevice}
                        selectedDeviceInternet={formData.selectedDeviceInternet}
                        selectedDeviceVoice={formData.selectedDeviceVoice}
                        onDeviceSelect={handleDeviceSelect}
                        onInternetDeviceSelect={handleInternetDeviceSelect}
                        onVoiceDeviceSelect={isCombo ? undefined : handleVoiceDeviceSelect}
                        disabled={disabled}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={disabled} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!canProceed() || disabled}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
