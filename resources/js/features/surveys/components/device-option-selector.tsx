import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { DeviceSelector } from './device-selector';
import { AvailableDevice } from '@/hooks/use-available-devices';

interface DeviceOptionSelectorProps {
    value?: boolean;
    onChange: (value: boolean) => void;
    serviceType?: string; // Service type for filtering devices
    mediaType?: string; // PON or COPPER - for manual survey device filtering
    selectedDevice?: AvailableDevice | null; // For single service (broadband/voice)
    selectedDeviceInternet?: AvailableDevice | null; // For combo internet device
    selectedDeviceVoice?: AvailableDevice | null; // For combo voice device
    onDeviceSelect?: (device: AvailableDevice) => void; // For single service
    onInternetDeviceSelect?: (device: AvailableDevice) => void; // For combo internet
    onVoiceDeviceSelect?: (device: AvailableDevice) => void; // For combo voice
    disabled?: boolean;
}

export function DeviceOptionSelector({
    value,
    onChange,
    serviceType,
    mediaType,
    selectedDevice,
    selectedDeviceInternet,
    selectedDeviceVoice,
    onDeviceSelect,
    onInternetDeviceSelect,
    onVoiceDeviceSelect,
    disabled,
}: DeviceOptionSelectorProps) {
    // Show message only when explicitly set to false (not undefined/null)
    const isWithoutDevice = value === false;
    const isWithDevice = value === true;
    // When undefined, use empty string so nothing is selected initially
    // When explicitly set, use the corresponding value
    const displayValue = value === undefined ? '' : value ? 'with' : 'without';
    const isCombo = serviceType === '180427974';
    const isVoiceOnly = serviceType === '1207609454';

    const handleDeviceSelect = (device: AvailableDevice) => {
        if (onDeviceSelect) {
            onDeviceSelect(device);
        }
    };

    const handleInternetDeviceSelect = (device: AvailableDevice) => {
        if (onInternetDeviceSelect) {
            onInternetDeviceSelect(device);
        }
    };

    const handleVoiceDeviceSelect = (device: AvailableDevice) => {
        if (onVoiceDeviceSelect) {
            onVoiceDeviceSelect(device);
        }
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">
                Device Option <span className="text-red-500">*</span>
            </Label>

            <RadioGroup
                value={displayValue}
                onValueChange={(val) => onChange(val === 'with')}
                className="space-y-2"
                disabled={disabled}
            >

                {/* WITH DEVICE */}
                <label
                    className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 transition sm:max-w-72',
                        disabled ? 'cursor-not-allowed opacity-50' : '',
                        displayValue === 'with'
                            ? 'border-gray-300 ring-1 ring-primary'
                            : 'border-border hover:border-muted-foreground/50',
                    )}
                >
                    <RadioGroupItem value="with" disabled={disabled} />
                    <span className="text-sm font-medium">With Device</span>
                </label>
                {/* WITHOUT DEVICE */}
                <label
                    className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 transition sm:max-w-72',
                        disabled ? 'cursor-not-allowed opacity-50' : '',
                        displayValue === 'without'
                            ? 'border-gray-300 ring-1 ring-primary'
                            : 'border-border hover:border-muted-foreground/50',
                    )}
                >
                    <RadioGroupItem value="without" disabled={disabled} />
                    <span className="text-sm font-medium">Without Device</span>
                </label>
            </RadioGroup>

            {/* ⚠️ Helper message (only for "Without Device") */}
            {isWithoutDevice && (
                <Alert className="border-et-blue">
                    <AlertDescription className="text-sm text-et-blue">
                        <p className="mb-2 font-medium">Please ensure your device is one of the supported models:</p>

                        <ul className="list-disc space-y-1 pl-5">
                            <li>Huawei Device</li>
                            <li>ZTE Device</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Device Selector (only for "With Device") */}
            {isWithDevice && !disabled && (
                <div className="mt-4">
                    <DeviceSelector
                        serviceType={serviceType}
                        mediaType={mediaType}
                        selectedDeviceId={isVoiceOnly ? selectedDeviceVoice?.id : selectedDevice?.id}
                        selectedDeviceInternetId={selectedDeviceInternet?.id}
                        selectedDeviceVoiceId={isCombo ? selectedDeviceVoice?.id : (isVoiceOnly ? selectedDeviceVoice?.id : undefined)}
                        onDeviceSelect={isVoiceOnly ? handleVoiceDeviceSelect : handleDeviceSelect}
                        onInternetDeviceSelect={handleInternetDeviceSelect}
                        onVoiceDeviceSelect={isCombo ? handleVoiceDeviceSelect : (isVoiceOnly ? handleVoiceDeviceSelect : undefined)}
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
}
