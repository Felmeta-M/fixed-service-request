import FormSelect from '@/components/common/form-select';
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
            <div className="w-full sm:max-w-72">
                <FormSelect
                    id="bandwidth"
                    label="Bandwidth"
                    labelRight={<span className="text-red-500">*</span>}
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
