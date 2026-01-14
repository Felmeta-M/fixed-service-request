import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAvailableDevices, AvailableDevice } from '@/hooks/use-available-devices';
import { CheckCircle, Loader2, Package } from 'lucide-react';

interface DeviceSelectorProps {
    selectedDeviceId?: string;
    onDeviceSelect: (device: AvailableDevice) => void;
    disabled?: boolean;
}

export function DeviceSelector({ selectedDeviceId, onDeviceSelect, disabled }: DeviceSelectorProps) {
    const { devices, loading, error } = useAvailableDevices();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-gray-600">Loading devices...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">Error loading devices: {error}</p>
            </div>
        );
    }

    if (devices.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">No devices available at the moment.</p>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    };

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">
                Select Device <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => {
                    const isSelected = selectedDeviceId === device.id;

                    return (
                        <label
                            key={device.id}
                            onClick={() => !disabled && onDeviceSelect(device)}
                            className={`group relative flex cursor-pointer flex-col rounded-lg border bg-white p-4 transition ${
                                disabled
                                    ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-50'
                                    : isSelected
                                      ? 'border-primary ring-2 ring-primary'
                                      : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                            }`}
                        >
                            <input
                                type="radio"
                                name="device"
                                value={device.id}
                                checked={isSelected}
                                onChange={() => {}}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                disabled={disabled}
                            />

                            <div className="flex items-start gap-3">
                                <div className={`rounded-lg p-2 ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                    <Package className="h-5 w-5" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                                {device.name}
                                            </h4>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {device.vendor} {device.model ? `- ${device.model}` : ''}
                                            </p>
                                        </div>
                                        {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-lg font-bold text-gray-900">{formatPrice(device.price)}</p>
                                    </div>

                                    {device.description && (
                                        <p className="mt-2 text-xs text-gray-600 line-clamp-2">{device.description}</p>
                                    )}

                                    {device.stock_quantity > 0 && (
                                        <p className="mt-2 text-xs text-green-600">
                                            {device.stock_quantity} in stock
                                        </p>
                                    )}
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

