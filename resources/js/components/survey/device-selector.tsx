import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAvailableDevices, AvailableDevice } from '@/hooks/use-available-devices';
import { CheckCircle, Loader2, Package, Wifi, Phone } from 'lucide-react';

interface DeviceSelectorProps {
    serviceType?: string; // '1457567289' (broadband), '1207609454' (voice), '180427974' (combo)
    selectedDeviceId?: string; // For single selection (broadband/voice)
    selectedDeviceInternetId?: string; // For combo internet device
    selectedDeviceVoiceId?: string; // For combo voice device
    onDeviceSelect?: (device: AvailableDevice) => void; // For single selection
    onInternetDeviceSelect?: (device: AvailableDevice) => void; // For combo internet
    onVoiceDeviceSelect?: (device: AvailableDevice) => void; // For combo voice
    disabled?: boolean;
}

const SERVICE_TYPES = {
    BROADBAND: '1457567289',
    VOICE: '1207609454',
    COMBO: '180427974',
};

export function DeviceSelector({
    serviceType,
    selectedDeviceId,
    selectedDeviceInternetId,
    selectedDeviceVoiceId,
    onDeviceSelect,
    onInternetDeviceSelect,
    onVoiceDeviceSelect,
    disabled,
}: DeviceSelectorProps) {
    const isCombo = serviceType === SERVICE_TYPES.COMBO;
    
    // Fetch all devices for combo, filtered devices for single service
    const { devices: allDevices, loading, error } = useAvailableDevices(isCombo ? undefined : serviceType);

    // Filter devices by type for combo
    const broadbandDevices = isCombo
        ? allDevices.filter((d) => d.device_type === 'broadband' || d.device_type === 'universal')
        : [];
    const voiceDevices = isCombo
        ? allDevices.filter((d) => d.device_type === 'voice' || d.device_type === 'universal')
        : [];

    // For single service, use all devices (already filtered by API)
    const displayDevices = isCombo ? [] : allDevices;

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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    };

    const renderDeviceCard = (device: AvailableDevice, isSelected: boolean, onSelect: () => void, namePrefix: string = 'device') => {
        return (
            <label
                key={device.id}
                onClick={() => !disabled && onSelect()}
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
                    name={namePrefix}
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
                            <p className="mt-2 text-xs text-green-600">{device.stock_quantity} in stock</p>
                        )}
                    </div>
                </div>
            </label>
        );
    };

    // Combo service - show two sections
    if (isCombo) {
        const hasInternetDevices = broadbandDevices.length > 0;
        const hasVoiceDevices = voiceDevices.length > 0;

        if (!hasInternetDevices && !hasVoiceDevices) {
            return (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">No devices available at the moment.</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Internet/Data Devices Section */}
                {hasInternetDevices && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Wifi className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold">
                                Internet/Data Device <span className="text-red-500">*</span>
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {broadbandDevices.map((device) => {
                                const isSelected = selectedDeviceInternetId === device.id;
                                return renderDeviceCard(
                                    device,
                                    isSelected,
                                    () => onInternetDeviceSelect?.(device),
                                    'device-internet'
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Voice Devices Section */}
                {hasVoiceDevices && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold">
                                Voice Device <span className="text-red-500">*</span>
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {voiceDevices.map((device) => {
                                const isSelected = selectedDeviceVoiceId === device.id;
                                return renderDeviceCard(
                                    device,
                                    isSelected,
                                    () => onVoiceDeviceSelect?.(device),
                                    'device-voice'
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Single service (Broadband or Voice)
    if (displayDevices.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">No devices available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">
                Select Device <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayDevices.map((device) => {
                    const isSelected = selectedDeviceId === device.id;
                    return renderDeviceCard(device, isSelected, () => onDeviceSelect?.(device), 'device');
                })}
            </div>
        </div>
    );
}
