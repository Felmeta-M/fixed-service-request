import FormSelect from '@/components/common/form-select';
import { ProcessedBandwidthOption } from '@/hooks/use-bandwidth-options';

interface BandwidthSelectorProps {
    residentialOptions: ProcessedBandwidthOption[];
    loading: boolean;
    selectedBandwidth: string;
    onBandwidthChange: (value: string, numericValue: number, customerType: 'residential') => void;
    error?: string;
}

export function BandwidthSelector({
    residentialOptions,
    loading,
    selectedBandwidth,
    onBandwidthChange,
    error,
}: BandwidthSelectorProps) {
    // Sort residential options in ascending order
    const sortedResidentialOptions = [...residentialOptions].sort((a, b) => a.numericValue - b.numericValue);

    const handleBandwidthSelect = (value: string) => {
        const selectedOption = sortedResidentialOptions.find((option) => option.value === value);
        if (selectedOption) {
            onBandwidthChange(value, selectedOption.numericValue, 'residential');
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
                    options={sortedResidentialOptions.map((option) => ({
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
