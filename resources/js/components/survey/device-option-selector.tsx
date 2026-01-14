// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { cn } from "@/lib/utils";

// interface DeviceOptionSelectorProps {
//     value: boolean;
//     onChange: (value: boolean) => void;
// }

// export function DeviceOptionSelector({ value, onChange }: DeviceOptionSelectorProps) {
//     return (
//         <div className="space-y-2">
//             <Label className="text-sm font-medium">Device Option</Label>

//             <RadioGroup
//                 value={value ? "with" : "without"}
//                 onValueChange={(val) => onChange(val === "with")}
//                 className="space-y-2"
//             >

//                 {/* WITHOUT DEVICE */}
//                 <label
//                     className={cn(
//                         "flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition w-full sm:max-w-72",
//                         !value
//                             ? "border-gray-300 ring-1 ring-primary"
//                             : "border-border hover:border-muted-foreground/50"
//                     )}
//                 >
//                     <RadioGroupItem value="without" />
//                     <span className="text-sm font-medium">Without Device</span>
//                 </label>

//                 {/* WITH DEVICE */}
//                 <label
//                     className={cn(
//                         "flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition w-full sm:max-w-72",
//                         value
//                             ? "border-gray-300 ring-1 ring-primary"
//                             : "border-border hover:border-muted-foreground/50"
//                     )}
//                 >
//                     <RadioGroupItem value="with" />
//                     <span className="text-sm font-medium">With Device</span>
//                 </label>
//             </RadioGroup>
//         </div>
//     );
// }

// hey, when we navigating and we are on review and submit step instead of finishing there like showing subscribe/pay(on that step), i want to add one step to the flow which is payment, so now we have four steps , service selection, location setup, review and submit and payment, so on last step which is new (payment) , we show every payment detail there , so for example instead of saying subscribe on step 3 when we dont have payment , now we take them payment page and show payment 0 so subscribe , something like that, and also we added the device option so if the device is  with device is selected when creating survey, we gona show that in payment, so even if it is intrnet and there is no cable cost , they have device (if they selected) (this is future even if its bqckend is not implemented lets just show),

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { DeviceSelector } from './device-selector';
import { AvailableDevice } from '@/hooks/use-available-devices';

interface DeviceOptionSelectorProps {
    value?: boolean;
    onChange: (value: boolean) => void;
    selectedDevice?: AvailableDevice | null;
    onDeviceSelect?: (device: AvailableDevice) => void;
    disabled?: boolean;
}

export function DeviceOptionSelector({
    value,
    onChange,
    selectedDevice,
    onDeviceSelect,
    disabled,
}: DeviceOptionSelectorProps) {
    // Show message only when explicitly set to false (not undefined/null)
    const isWithoutDevice = value === false;
    const isWithDevice = value === true;
    // When undefined, use empty string so nothing is selected initially
    // When explicitly set, use the corresponding value
    const displayValue = value === undefined ? '' : value ? 'with' : 'without';

    const handleDeviceSelect = (device: AvailableDevice) => {
        if (onDeviceSelect) {
            onDeviceSelect(device);
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
                        selectedDeviceId={selectedDevice?.id}
                        onDeviceSelect={handleDeviceSelect}
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
}
