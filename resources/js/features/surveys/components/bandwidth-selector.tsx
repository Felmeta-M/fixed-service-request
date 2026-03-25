import FormSelect from '@/components/common/form-select';
import { ProcessedBandwidthOption } from '@/hooks/use-bandwidth-options';

interface BandwidthSelectorProps {
    residentialOptions: ProcessedBandwidthOption[];
    loading: boolean;
    selectedBandwidth: string;
    onBandwidthChange: (value: string, numericValue: number, customerType: 'residential') => void;
    error?: string;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
};

export function BandwidthSelector({
    residentialOptions,
    loading,
    selectedBandwidth,
    onBandwidthChange,
    error,
}: BandwidthSelectorProps) {
    const sortedResidentialOptions = [...residentialOptions].sort((a, b) => a.numericValue - b.numericValue);

    const handleBandwidthSelect = (value: string) => {
        const selectedOption = sortedResidentialOptions.find((option) => option.value === value);
        if (selectedOption) {
            onBandwidthChange(value, selectedOption.numericValue, 'residential');
        }
    };

    const selectedOption = sortedResidentialOptions.find((option) => option.value === selectedBandwidth);

    return (
        <div className="flex flex-col space-y-4">
            <div className="w-full sm:max-w-72">
                <FormSelect
                    id="bandwidth"
                    label="Bandwidth"
                    // labelRight={<span className="text-red-500">*</span>}
                    required
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

            {selectedOption && selectedOption.price != null && (
                <div className="w-full rounded-lg border border-gray-300 p-4 sm:max-w-72">
                    <p className="text-xs font-medium text-gray-500">Monthly Fee</p>
                    <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-gray-900">{selectedOption.label}</span>
                        <span className="text-lg font-bold text-primary">{formatPrice(selectedOption.price)}<span className="text-xs font-normal text-gray-500">/Month</span></span>
                    </div>
                </div>
            )}
        </div>
    );
}
