import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBandwidthOptions, type ProcessedBandwidthOption } from '@/hooks/use-bandwidth-options';
import { ArrowDownToLineIcon, ArrowUpToLineIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface BandwidthChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (bandwidth: string) => void;
    loading?: boolean;
    mode: 'upgrade' | 'downgrade';
    currentBandwidth?: string;
    serviceNumber?: string;
    customerType?: 'residential' | string;
}

export function BandwidthChangeDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
    mode,
    currentBandwidth,
    serviceNumber,
    customerType = 'residential', // Default to residential if not provided
}: BandwidthChangeDialogProps) {
    const [selectedBandwidth, setSelectedBandwidth] = useState('');
    const { residentialOptions, loading: loadingOptions, parseBandwidthValue } = useBandwidthOptions();

    // Reset selection when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedBandwidth('');
        }
    }, [open]);

    // Parse current bandwidth value
    const currentNumericValue = currentBandwidth ? parseBandwidthValue(currentBandwidth) : 0;

    // Only use residential options (enterprise options are not fetched)
    const optionsToUse = residentialOptions;

    // Filter options based on mode (upgrade shows higher, downgrade shows lower)
    // For upgrade: only show residential options that are strictly greater than current bandwidth
    // For downgrade: only show residential options that are strictly less than current bandwidth
    const filteredOptions = optionsToUse
        .filter((option: ProcessedBandwidthOption) => {
            if (mode === 'upgrade') {
                // Only show options strictly greater than current bandwidth
                return option.numericValue > currentNumericValue;
            } else {
                // Only show options strictly less than current bandwidth
                return option.numericValue < currentNumericValue;
            }
        })
        .sort((a: ProcessedBandwidthOption, b: ProcessedBandwidthOption) => a.numericValue - b.numericValue);

    const handleConfirm = () => {
        if (selectedBandwidth) {
            onConfirm(selectedBandwidth);
        }
    };

    const selectedOption = useMemo(
        () => filteredOptions.find((o) => o.value === selectedBandwidth),
        [filteredOptions, selectedBandwidth],
    );

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);

    const isUpgrade = mode === 'upgrade';
    const Icon = isUpgrade ? ArrowUpToLineIcon : ArrowDownToLineIcon;
    const iconColor = isUpgrade ? 'text-primary' : 'text-orange-600';
    const bgColor = isUpgrade ? 'bg-primary/10' : 'bg-orange-100';

    return (
        <AlertDialog open={open} onOpenChange={!loading ? onOpenChange : undefined}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <AlertDialogTitle>{isUpgrade ? 'Upgrade' : 'Downgrade'} Service Plan</AlertDialogTitle>
                    </div>

                    <AlertDialogDescription>
                        {isUpgrade
                            ? 'Select a higher bandwidth plan to upgrade your service.'
                            : 'Select a lower bandwidth plan to downgrade your service.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Service Info */}
                {serviceNumber && (
                    <div className="mt-2 rounded-md bg-gray-50 p-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Service Number:</span> {serviceNumber}
                        </div>
                        {currentBandwidth && (
                            <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Current Bandwidth:</span> {currentBandwidth}
                            </div>
                        )}
                    </div>
                )}

                {/* Bandwidth Selection */}
                <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                        New Bandwidth <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedBandwidth} onValueChange={setSelectedBandwidth} disabled={loading || loadingOptions}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingOptions ? 'Loading options...' : 'Select bandwidth'} />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredOptions.length === 0 ? (
                                <div className="px-2 py-4 text-center text-sm text-gray-500">
                                    No {isUpgrade ? 'higher' : 'lower'} bandwidth options available
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.price != null
                                            ? `${option.label} - ${formatPrice(option.price)}/month`
                                            : option.label}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Price Summary */}
                {selectedOption && selectedOption.price != null && (
                    <div className="mt-3 rounded-md border border-primary/20 p-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm font-medium text-gray-700">{selectedOption.label}</span>
                            <span className="text-base font-bold text-primary">
                                {formatPrice(selectedOption.price)}<span className="text-xs font-normal text-gray-500">/month</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Info Note */}
                <div className={`mt-4 rounded-md border p-3 ${isUpgrade ? 'border-primary bg-primary/10' : 'border-orange-200 bg-orange-50'}`}>
                    <div className="flex items-start gap-2">
                        <Icon className={`mt-0.5 h-4 w-4 ${iconColor}`} />
                        <p className={`text-xs ${isUpgrade ? 'text-primary' : 'text-orange-700'}`}>
                            {isUpgrade
                                ? 'Upgrading your plan may result in additional charges based on the new bandwidth.'
                                : 'Downgrading your plan will take effect on your next billing cycle.'}
                        </p>
                    </div>
                </div>

                {/* Footer Buttons */}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading} onClick={() => onOpenChange(false)}>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        disabled={!selectedBandwidth || loading}
                        onClick={handleConfirm}
                        className={isUpgrade ? 'bg-primary hover:bg-primary/80' : 'bg-orange-600 hover:bg-orange-700'}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                            </div>
                        ) : (
                            `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
