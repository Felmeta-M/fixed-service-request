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

    // Sort residential options in ascending order
    const sortedResidentialOptions = [...residentialOptions].sort((a, b) => a.numericValue - b.numericValue);

    const currentOptions = customerType === 'residential' ? sortedResidentialOptions : enterpriseOptions;

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
        <div className="flex flex-col space-y-6">
            {/* Customer Type Selector */}
            <div>
                <Label className="mb-2 block text-sm font-medium text-gray-900">Customer Type *</Label>
                <RadioGroup value={customerType} onValueChange={handleCustomerTypeChange} className="flex space-x-4">
                    <label className="flex items-center rounded-lg px-4 py-2 text-gray-900 transition hover:bg-gray-100">
                        <RadioGroupItem value="residential" className="mr-2 h-4 w-4" />
                        Residential
                    </label>
                    <label className="flex items-center rounded-lg px-4 py-2 text-gray-900 transition hover:bg-gray-100">
                        <RadioGroupItem value="enterprise" className="mr-2 h-4 w-4" />
                        Enterprise
                    </label>
                </RadioGroup>
            </div>

            {/* Bandwidth Selector */}
            <div className="max-w-72">
                <FormSelect
                    id="bandwidth"
                    label="Bandwidth *"
                    value={selectedBandwidth}
                    onChange={handleBandwidthSelect}
                    options={currentOptions.map((option) => ({
                        label: option.label,
                        value: option.value,
                    }))}
                    placeholder="Select bandwidth"
                    error={error}
                    loading={loading}
                />
            </div>
        </div>
    );
}
