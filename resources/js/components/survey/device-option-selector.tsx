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


import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DeviceOptionSelectorProps {
    value: boolean;
    onChange: (value: boolean) => void;
}

export function DeviceOptionSelector({ value, onChange }: DeviceOptionSelectorProps) {
    const isWithoutDevice = value === false;

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Device Option</Label>

            <RadioGroup
                value={value ? "with" : "without"}
                onValueChange={(val) => onChange(val === "with")}
                className="space-y-2"
            >
                {/* WITHOUT DEVICE */}
                <label
                    className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition w-full sm:max-w-72",
                        isWithoutDevice
                            ? "border-gray-300 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/50"
                    )}
                >
                    <RadioGroupItem value="without" />
                    <span className="text-sm font-medium">Without Device</span>
                </label>

                {/* WITH DEVICE */}
                <label
                    className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition w-full sm:max-w-72",
                        value
                            ? "border-gray-300 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/50"
                    )}
                >
                    <RadioGroupItem value="with" />
                    <span className="text-sm font-medium">With Device</span>
                </label>
            </RadioGroup>

            {/* ⚠️ Helper message (only for "Without Device") */}
            {/* {isWithoutDevice && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-700">
                        Please make sure your device is compatible before proceeding
                        (e.g. Huawei, ZTE, or other supported ONT devices).
                    </AlertDescription>
                </Alert>
            )} */}
            {isWithoutDevice && (
                <Alert className="border-blue-200 ">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-700">
                        <p className="mb-2 font-medium">
                            Please ensure your device is one of the supported models:
                        </p>

                        <ul className="list-disc pl-5 space-y-1">
                            <li>Huawei ONT</li>
                            <li>ZTE ONT</li>
                            <li>FiberHome ONT</li>
                            <li>Nokia ONT</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
