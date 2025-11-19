// // import FormSelect from '@/components/form-select';
// // import { Label } from '@/components/ui/label';
// // import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// // import { ProcessedBandwidthOption } from '@/hooks/use-bandwidth-options';

// // interface BandwidthSelectorProps {
// //     residentialOptions: ProcessedBandwidthOption[];
// //     enterpriseOptions: ProcessedBandwidthOption[];
// //     loading: boolean;
// //     selectedBandwidth: string;
// //     onBandwidthChange: (value: string, numericValue: number, customerType: 'residential' | 'enterprise') => void;
// //     error?: string;
// //     customerType: 'residential' | 'enterprise';
// //     onCustomerTypeChange: (type: 'residential' | 'enterprise') => void;
// // }

// // export function BandwidthSelector({
// //     residentialOptions,
// //     enterpriseOptions,
// //     loading,
// //     selectedBandwidth,
// //     onBandwidthChange,
// //     error,
// //     customerType,
// //     onCustomerTypeChange,
// // }: BandwidthSelectorProps) {
// //     const currentOptions = customerType === 'residential' ? residentialOptions : enterpriseOptions;

// //     const handleBandwidthSelect = (value: string) => {
// //         const selectedOption = currentOptions.find((option) => option.value === value);
// //         if (selectedOption) {
// //             onBandwidthChange(value, selectedOption.numericValue, customerType);
// //         }
// //     };

// //     return (
// //         <div className="space-y-4">
// //             <div>
// //                 <Label className="mb-3 block text-sm font-medium text-gray-700">Customer Type *</Label>
// //                 <RadioGroup value={customerType} onValueChange={onCustomerTypeChange} className="grid grid-cols-2 gap-4">
// //                     <div className="flex items-center space-x-2 rounded-lg border p-4">
// //                         <RadioGroupItem value="residential" id="residential" />
// //                         <Label htmlFor="residential" className="cursor-pointer">
// //                             Residential
// //                         </Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2 rounded-lg border p-4">
// //                         <RadioGroupItem value="enterprise" id="enterprise" />
// //                         <Label htmlFor="enterprise" className="cursor-pointer">
// //                             Enterprise
// //                         </Label>
// //                     </div>
// //                 </RadioGroup>
// //             </div>

// //             <div>
// //                 <FormSelect
// //                     id="bandwidth"
// //                     label="Bandwidth *"
// //                     value={selectedBandwidth}
// //                     onChange={handleBandwidthSelect}
// //                     options={currentOptions.map((option) => ({
// //                         label: option.label,
// //                         value: option.value,
// //                     }))}
// //                     error={error}
// //                     loading={loading}
// //                     placeholder={`Select ${customerType} bandwidth`}
// //                 />
// //             </div>
// //         </div>
// //     );
// // }

// import FormSelect from '@/components/form-select';
// import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { ProcessedBandwidthOption } from '@/hooks/use-bandwidth-options';
// import { useState } from 'react';

// interface BandwidthSelectorProps {
//     residentialOptions: ProcessedBandwidthOption[];
//     enterpriseOptions: ProcessedBandwidthOption[];
//     loading: boolean;
//     selectedBandwidth: string;
//     onBandwidthChange: (value: string, numericValue: number, customerType: 'residential' | 'enterprise') => void;
//     error?: string;
// }

// export function BandwidthSelector({
//     residentialOptions,
//     enterpriseOptions,
//     loading,
//     selectedBandwidth,
//     onBandwidthChange,
//     error,
// }: BandwidthSelectorProps) {
//     const [customerType, setCustomerType] = useState<'residential' | 'enterprise'>('residential');
//     const currentOptions = customerType === 'residential' ? residentialOptions : enterpriseOptions;

//     const handleCustomerTypeChange = (type: 'residential' | 'enterprise') => {
//         setCustomerType(type);
//         // Reset bandwidth when changing customer type
//         onBandwidthChange('', 0, type);
//     };

//     const handleBandwidthSelect = (value: string) => {
//         const selectedOption = currentOptions.find((option) => option.value === value);
//         if (selectedOption) {
//             onBandwidthChange(value, selectedOption.numericValue, customerType);
//         }
//     };

//     return (
//         <div className="space-y-4">
//             <div>
//                 <Label className="mb-3 block text-sm font-medium text-gray-700">Customer Type *</Label>
//                 <RadioGroup value={customerType} onValueChange={handleCustomerTypeChange} className="grid grid-cols-2 gap-4">
//                     <div className="flex items-center space-x-2 rounded-lg border p-4">
//                         <RadioGroupItem value="residential" id="residential" />
//                         <Label htmlFor="residential" className="cursor-pointer">
//                             Residential
//                         </Label>
//                     </div>
//                     <div className="flex items-center space-x-2 rounded-lg border p-4">
//                         <RadioGroupItem value="enterprise" id="enterprise" />
//                         <Label htmlFor="enterprise" className="cursor-pointer">
//                             Enterprise
//                         </Label>
//                     </div>
//                 </RadioGroup>
//             </div>

//             <div>
//                 <FormSelect
//                     id="bandwidth"
//                     label="Bandwidth *"
//                     value={selectedBandwidth}
//                     onChange={handleBandwidthSelect}
//                     options={currentOptions.map((option) => ({
//                         label: option.label,
//                         value: option.value,
//                     }))}
//                     error={error}
//                     loading={loading}
//                     placeholder={`Select ${customerType} bandwidth`}
//                 />
//             </div>

//             {/* {selectedBandwidth && (
//                 <div className="rounded-lg bg-blue-50 p-3">
//                     <p className="text-sm text-blue-700">
//                         Selected: {selectedBandwidth} ({customerType === 'residential' ? 'Residential' : 'Enterprise'} - ID:{' '}
//                         {customerType === 'residential' ? '1457567289' : '1043913525'})
//                     </p>
//                 </div>
//             )} */}
//         </div>
//     );
// }

import FormSelect from '@/components/form-select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ProcessedBandwidthOption } from '@/hooks/use-bandwidth-options';
import { useState } from 'react';

interface BandwidthSelectorProps {
    residentialOptions: ProcessedBandwidthOption[];
    enterpriseOptions: ProcessedBandwidthOption[];
    loading: boolean;
    selectedBandwidth: string;
    onBandwidthChange: (value: string, numericValue: number, customerType: 'residential' | 'enterprise') => void;
    error?: string;
}

export function BandwidthSelector({
    residentialOptions,
    enterpriseOptions,
    loading,
    selectedBandwidth,
    onBandwidthChange,
    error,
}: BandwidthSelectorProps) {
    const [customerType, setCustomerType] = useState<'residential' | 'enterprise'>('residential');
    const currentOptions = customerType === 'residential' ? residentialOptions : enterpriseOptions;

    const handleCustomerTypeChange = (type: 'residential' | 'enterprise') => {
        setCustomerType(type);
        onBandwidthChange('', 0, type); // reset bandwidth when type changes
    };

    const handleBandwidthSelect = (value: string) => {
        const selectedOption = currentOptions.find((option) => option.value === value);
        if (selectedOption) {
            onBandwidthChange(value, selectedOption.numericValue, customerType);
        }
    };

    return (
        <div className="flex items-center justify-between space-y-6">
            {/* Customer Type Selector */}
            <div>
                <Label className="mb-2 block text-sm font-medium text-gray-900">Customer Type</Label>
                <RadioGroup value={customerType} onValueChange={handleCustomerTypeChange} className="flex space-x-4">
                    <label className="flex items-center rounded-lg px-4 py-2 text-gray-900 transition">
                        <RadioGroupItem value="residential" className="mr-2 h-4 w-4" />
                        Residential
                    </label>
                    <label className="flex items-center rounded-lg px-4 py-2 text-gray-900 transition">
                        <RadioGroupItem value="enterprise" className="mr-2 h-4 w-4" />
                        Enterprise
                    </label>
                </RadioGroup>
            </div>

            {/* Bandwidth Selector */}
            <div>
                <FormSelect
                    id="bandwidth"
                    label="Bandwidth"
                    value={selectedBandwidth}
                    onChange={handleBandwidthSelect}
                    options={currentOptions.map((option) => ({
                        label: option.label,
                        value: option.value,
                    }))}
                    placeholder="Select bandwidth"
                    error={error}
                    loading={loading}
                    className="rounded-lg border-gray-300 shadow-sm hover:border-gray-400"
                />
            </div>
        </div>
    );
}
