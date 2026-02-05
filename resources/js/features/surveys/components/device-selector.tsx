import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AvailableDevice, useAvailableDevices } from '@/hooks/use-available-devices';
import { cn } from '@/lib/utils';
import { Award, Check, ChevronDown, Maximize2, Network, Package, Phone, RadioTower, Sparkles, Wifi, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const SERVICE_TYPES = {
    BROADBAND: '1457567289',
    VOICE: '1207609454',
    COMBO: '102647257',
};

interface DeviceSelectorProps {
    serviceType?: string;
    mediaType?: string;
    selectedDeviceId?: string;
    selectedDeviceInternetId?: string;
    selectedDeviceVoiceId?: string;
    onDeviceSelect?: (device: AvailableDevice | null) => void; // null = unselect/toggle off
    onInternetDeviceSelect?: (device: AvailableDevice | null) => void;
    onVoiceDeviceSelect?: (device: AvailableDevice | null) => void;
    disabled?: boolean;
}

export function DeviceSelector({
    serviceType,
    mediaType,
    selectedDeviceId,
    selectedDeviceInternetId,
    selectedDeviceVoiceId,
    onDeviceSelect,
    onInternetDeviceSelect,
    onVoiceDeviceSelect,
    disabled,
}: DeviceSelectorProps) {
    const isCombo = serviceType === SERVICE_TYPES.COMBO;

    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());

    const { devices: allDevices, loading, error } = useAvailableDevices(isCombo ? undefined : serviceType, mediaType);

    const { broadbandDevices, voiceDevices, displayDevices } = useMemo(() => {
        const broadband = isCombo ? allDevices.filter((d: AvailableDevice) => d.device_type === 'broadband' || d.device_type === 'universal') : [];

        const voice = isCombo ? allDevices.filter((d: AvailableDevice) => d.device_type === 'voice' || d.device_type === 'universal') : [];

        const display = isCombo ? [] : allDevices;

        return { broadbandDevices: broadband, voiceDevices: voice, displayDevices: display };
    }, [allDevices, isCombo]);

    const handleImageError = useCallback((deviceId: string) => {
        setImageErrors((prev) => new Set(prev).add(deviceId));
    }, []);

    const toggleSpecs = useCallback((deviceId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Stop event from bubbling to parent
        e.preventDefault(); // Prevent any default behavior
        setExpandedSpecs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(deviceId)) {
                newSet.delete(deviceId);
            } else {
                newSet.add(deviceId);
            }
            return newSet;
        });
    }, []);

    const handleDeviceSelect = useCallback(
        (device: AvailableDevice, selectFn?: (device: AvailableDevice) => void) => {
            if (disabled) return;
            selectFn?.(device);
        },
        [disabled],
    );

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const renderSpecificationItem = (icon: React.ReactNode, label: string, value: string | string[] | Record<string, any>) => {
        if (!value) return null;

        let displayValue: string;
        if (Array.isArray(value)) {
            displayValue = value.join(', ');
        } else if (typeof value === 'object') {
            displayValue = Object.entries(value)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
        } else {
            displayValue = value;
        }

        return (
            <div className="flex items-start gap-2 py-1.5">
                <div className="mt-0.5 shrink-0 text-primary">{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-xs font-medium text-gray-700">{label}</p>
                    <p className="text-xs leading-relaxed text-gray-600">{displayValue}</p>
                </div>
            </div>
        );
    };

    const renderSpecificationCategory = (specs: any) => {
        const categories = [
            {
                title: 'Performance',
                icon: <Zap className="h-3.5 w-3.5" />,
                specs: [
                    { key: 'speed', label: 'Speed', icon: <Zap className="h-3.5 w-3.5" /> },
                    { key: 'wifi_features', label: 'Wi-Fi', icon: <Wifi className="h-3.5 w-3.5" /> },
                    { key: 'voice_quality', label: 'Voice Quality', icon: <Phone className="h-3.5 w-3.5" /> },
                ],
            },
            {
                title: 'Connectivity',
                icon: <Network className="h-3.5 w-3.5" />,
                specs: [
                    { key: 'ethernet', label: 'Ethernet', icon: <Network className="h-3.5 w-3.5" /> },
                    { key: 'connection', label: 'Connection', icon: <RadioTower className="h-3.5 w-3.5" /> },
                    { key: 'lan_ports', label: 'LAN Ports', icon: <Network className="h-3.5 w-3.5" /> },
                ],
            },
            {
                title: 'Features',
                icon: <Sparkles className="h-3.5 w-3.5" />,
                specs: [
                    { key: 'functionality', label: 'Functionality', icon: <Maximize2 className="h-3.5 w-3.5" /> },
                    { key: 'calling_options', label: 'Calling Options', icon: <Phone className="h-3.5 w-3.5" /> },
                    { key: 'display', label: 'Display', icon: <Package className="h-3.5 w-3.5" /> },
                ],
            },
        ];

        return (
            <div className="space-y-3">
                {categories.map((category) => {
                    const hasSpecs = category.specs.some((spec) => specs[spec.key]);
                    if (!hasSpecs) return null;

                    return (
                        <div key={category.title} className="space-y-2">
                            <div className="flex items-center gap-2">
                                {category.icon}
                                <h4 className="text-xs font-semibold text-gray-900">{category.title}</h4>
                            </div>
                            <div className="space-y-1 pl-4">
                                {category.specs.map((spec) => {
                                    const value = specs[spec.key];
                                    if (!value) return null;
                                    return renderSpecificationItem(spec.icon, spec.label, value);
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDeviceCard = (device: AvailableDevice, isSelected: boolean, onSelect: () => void, namePrefix: string = 'device') => {
        const hasImage = device.image_url && device.image_url.trim().length > 0;
        const imageError = imageErrors.has(device.id);
        const specs = device.specifications || {};
        const specsExpanded = expandedSpecs.has(device.id);
        const hasSpecs = Object.keys(specs).length > 0;

        // Handle card click for selection
        const handleCardClick = () => {
            if (disabled) return;
            onSelect();
        };

        // Handle click on non-interactive parts of the card
        const handleMainContentClick = (e: React.MouseEvent) => {
            // Only trigger device selection if clicking on non-button areas
            const target = e.target as HTMLElement;
            const isButton = target.tagName === 'BUTTON' || target.closest('button') || target.closest('[data-specs-area]');

            if (!isButton) {
                handleDeviceSelect(device, onSelect ? () => onSelect() : undefined);
            }
        };

        return (
            <div className="group">
                <div
                    onClick={handleMainContentClick}
                    className={cn(
                        'relative cursor-pointer rounded-lg border bg-white transition-all duration-200',
                        disabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50/50 opacity-50'
                            : isSelected
                              ? 'border-primary shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-xs',
                    )}
                >
                    {/* Selection Indicator */}
                    <div className="absolute top-3 right-3 z-10">
                        {isSelected ? (
                            <div className="rounded-full bg-primary p-1.5">
                                <Check className="h-4 w-4 text-white" />
                            </div>
                        ) : (
                            <div className="rounded-full border-2 border-gray-300 bg-white p-1.5 transition-colors group-hover:border-gray-400">
                                <div className="h-4 w-4" />
                            </div>
                        )}
                    </div>

                    {/* Featured Badge */}
                    {device.featured && (
                        <div className="absolute top-3 left-3 z-10">
                            <Badge className="border-0 bg-primary px-2 py-0.5 text-xs text-white">
                                <Award className="mr-1 h-3 w-3" />
                                Featured
                            </Badge>
                        </div>
                    )}

                    {/* Device Image Section */}
                    <div className="relative h-40 overflow-hidden bg-gray-50">
                        {hasImage && !imageError ? (
                            <>
                                <img
                                    src={device.image_url || ''}
                                    alt={device.name}
                                    className="h-full w-full object-contain p-4"
                                    onError={() => handleImageError(device.id)}
                                />
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className={cn('p-4 transition-colors', isSelected ? 'text-primary' : 'text-gray-400')}>
                                    {device.device_type === 'broadband' ? (
                                        <Wifi className="h-12 w-12" />
                                    ) : device.device_type === 'voice' ? (
                                        <Phone className="h-12 w-12" />
                                    ) : (
                                        <Package className="h-12 w-12" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                        {/* Header */}
                        <div className="mb-2 space-y-1">
                            <h4 className={cn('line-clamp-1 text-base leading-tight font-semibold', isSelected ? 'text-primary' : 'text-gray-900')}>
                                {device.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-600">
                                    {device.vendor} {device.model ? `• ${device.model}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-3">
                            <span className="text-lg font-bold text-gray-900">{formatPrice(device.price)}</span>
                        </div>

                        {/* Description */}
                        {device.description && (
                            <div className="mb-3 space-y-1">
                                <p className="text-xs font-medium text-gray-700">Overview</p>
                                <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{device.description}</p>
                            </div>
                        )}

                        {/* Specifications Toggle - SEPARATE FROM SELECTION */}
                        {hasSpecs && (
                            <div className="border-t pt-3" data-specs-area="true">
                                <button
                                    type="button"
                                    onClick={(e) => toggleSpecs(device.id, e)}
                                    className={cn(
                                        'flex w-full items-center justify-between transition-colors duration-200',
                                        specsExpanded ? 'text-primary' : 'text-gray-600 hover:text-gray-900',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Maximize2 className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">Technical Specifications</span>
                                    </div>
                                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', specsExpanded && 'rotate-180')} />
                                </button>

                                {/* Expandable Specifications */}
                                <div
                                    className={cn(
                                        'overflow-hidden transition-all duration-300 ease-in-out',
                                        specsExpanded ? 'mt-3 max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
                                    )}
                                >
                                    <div className="space-y-3 pt-2">{renderSpecificationCategory(specs)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="rounded-lg border bg-white p-4">
                            <div className="mb-3 h-40 w-full animate-pulse rounded bg-gray-200"></div>
                            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-gray-200"></div>
                            <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                            <div className="mb-3 h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
                        </div>
                    ))}
                </div>
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

    // Combo service layout
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
                                Internet/Data Device <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {broadbandDevices.map((device: AvailableDevice) => {
                                const isSelected = selectedDeviceInternetId === device.id;
                                return (
                                    <div key={device.id}>
                                        {renderDeviceCard(
                                            device,
                                            isSelected,
                                            () => onInternetDeviceSelect?.(isSelected ? null : device),
                                            'device-internet',
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Voice/Phone Devices Section */}
                {hasVoiceDevices && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold">
                                Voice/Phone Device <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {voiceDevices.map((device: AvailableDevice) => {
                                const isSelected = selectedDeviceVoiceId === device.id;
                                return (
                                    <div key={device.id}>
                                        {renderDeviceCard(
                                            device,
                                            isSelected,
                                            () => onVoiceDeviceSelect?.(isSelected ? null : device),
                                            'device-voice',
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Single service layout
    if (displayDevices.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">No devices available at the moment.</p>
            </div>
        );
    }

    // Single service (data/broadband or voice): device is mandatory when "With device" — no unselect
    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">
                Select Device <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {displayDevices.map((device: AvailableDevice) => {
                    const isSelected = selectedDeviceId === device.id;
                    return <div key={device.id}>{renderDeviceCard(device, isSelected, () => onDeviceSelect?.(device), 'device')}</div>;
                })}
            </div>
        </div>
    );
}
