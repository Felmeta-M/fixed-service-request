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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { ArrowUpToLineIcon, ArrowDownToLineIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BandwidthChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (bandwidth: string) => void;
    loading?: boolean;
    mode: 'upgrade' | 'downgrade';
    currentBandwidth?: string;
    serviceNumber?: string;
}

export function BandwidthChangeDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
    mode,
    currentBandwidth,
    serviceNumber,
}: BandwidthChangeDialogProps) {
    const [selectedBandwidth, setSelectedBandwidth] = useState('');
    const { residentialOptions, enterpriseOptions, loading: loadingOptions, parseBandwidthValue } = useBandwidthOptions();

    // Reset selection when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedBandwidth('');
        }
    }, [open]);

    // Combine and sort all options
    const allOptions = [...residentialOptions, ...enterpriseOptions]
        .filter((v, i, arr) => arr.findIndex((o) => o.value === v.value) === i) // unique values
        .sort((a, b) => a.numericValue - b.numericValue);

    // Parse current bandwidth value
    const currentNumericValue = currentBandwidth ? parseBandwidthValue(currentBandwidth) : 0;

    // Filter options based on mode (upgrade shows higher, downgrade shows lower)
    const filteredOptions = allOptions.filter((option) => {
        if (mode === 'upgrade') {
            return option.numericValue > currentNumericValue;
        } else {
            return option.numericValue < currentNumericValue;
        }
    });

    const handleConfirm = () => {
        if (selectedBandwidth) {
            onConfirm(selectedBandwidth);
        }
    };

    const isUpgrade = mode === 'upgrade';
    const Icon = isUpgrade ? ArrowUpToLineIcon : ArrowDownToLineIcon;
    const iconColor = isUpgrade ? 'text-green-600' : 'text-orange-600';
    const bgColor = isUpgrade ? 'bg-green-100' : 'bg-orange-100';

    return (
        <AlertDialog open={open} onOpenChange={!loading ? onOpenChange : undefined}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <AlertDialogTitle>
                            {isUpgrade ? 'Upgrade' : 'Downgrade'} Service Plan
                        </AlertDialogTitle>
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
                            <div className="text-sm text-gray-600 mt-1">
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
                    <Select
                        value={selectedBandwidth}
                        onValueChange={setSelectedBandwidth}
                        disabled={loading || loadingOptions}
                    >
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
                                        {option.label}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Info Note */}
                <div className={`mt-4 rounded-md border p-3 ${isUpgrade ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                    <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 ${iconColor}`} />
                        <p className={`text-xs ${isUpgrade ? 'text-green-700' : 'text-orange-700'}`}>
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
                        className={isUpgrade ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
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

