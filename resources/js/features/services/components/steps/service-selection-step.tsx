import { BandwidthSelector } from '@/features/surveys/components/bandwidth-selector';
import { DeviceOptionSelector } from '@/features/surveys/components/device-option-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { useServiceTypes } from '@/hooks/use-service-types';
import { Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Loader2, Package, Phone, Wifi } from 'lucide-react';
import { useEffect, useMemo } from 'react';

interface ServiceSelectionStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    hasActiveSurvey: boolean;
}

// Icon mapping for dynamic service types
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Wifi: Wifi,
    Phone: Phone,
    Package: Package,
};

export function ServiceSelectionStep({ formData, onUpdate, hasActiveSurvey }: ServiceSelectionStepProps) {
    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths } = useBandwidthOptions();
    const { serviceTypes, loading: loadingServiceTypes } = useServiceTypes();

    // Transform service types for rendering
    const transformedServiceTypes = useMemo(() => {
        return serviceTypes.map((st) => ({
            value: st.code,
            name: st.name,
            description: st.description || '',
            icon: iconMap[st.icon || 'Wifi'] || Wifi,
            color: st.color || 'blue',
            recommended: st.recommended,
        }));
    }, [serviceTypes]);

    // Set default bandwidth to "5M" when options are loaded and bandwidth is empty
    useEffect(() => {
        if (!loadingBandwidths && residentialOptions.length > 0 && !formData.bandwidth) {
            // Find "5M" in residential options (case-insensitive, handle variations like "5M", "5Mbps", etc.)
            const defaultBandwidth = residentialOptions.find(
                (option) => option.value.toLowerCase().includes('7m') || option.value.toLowerCase().includes('7 mbps') || option.numericValue === 5,
            );

            if (defaultBandwidth) {
                onUpdate({
                    bandwidth: defaultBandwidth.value,
                    bandwidthNumericValue: defaultBandwidth.numericValue,
                    customerType: 'residential',
                });
            }
        }
    }, [loadingBandwidths, residentialOptions, formData.bandwidth, onUpdate]);

    const handleServiceSelect = (serviceId: string) => {
        if (hasActiveSurvey) return; // Prevent selection if there's an active survey
        
        // Clear device data when switching to Voice service (no device option for Voice)
        const isVoiceService = serviceId === '1207609454';
        if (isVoiceService) {
            onUpdate({ 
                serviceType: serviceId,
                withDevice: false,
                selectedDevice: null,
                selectedDeviceInternet: null,
                selectedDeviceVoice: null,
                deviceId: null,
                deviceVoiceId: null,
            });
        } else {
            onUpdate({ serviceType: serviceId });
        }
    };

    const handleBandwidthChange = (value: string, numericValue: number, type: string) => {
        onUpdate({
            bandwidth: value,
            bandwidthNumericValue: numericValue,
            customerType: type,
        });
    };

    if (loadingServiceTypes) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading service types...</span>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 gap-2 gap-y-4 sm:grid-cols-2 md:gap-x-4 lg:grid-cols-3">
                {transformedServiceTypes.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.serviceType === service.value;

                    return (
                        <label
                            key={service.value}
                            onClick={() => !hasActiveSurvey && handleServiceSelect(service.value)}
                            className={`group relative flex cursor-pointer flex-col rounded-lg border bg-white p-5 transition ${hasActiveSurvey ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-50' : ''} ${isSelected ? 'border-gray-300 ring-1 ring-primary' : 'border-gray-300 hover:border-gray-400 hover:shadow-md'} `}
                        >
                            <input
                                type="radio"
                                name="serviceType"
                                value={service.value}
                                checked={isSelected}
                                onChange={() => {}}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                disabled={hasActiveSurvey}
                            />

                            <div className="flex items-start gap-2">
                                <div className={`rounded-xl p-3 ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                                    <Icon className="h-6 w-6" />
                                </div>

                                <div className="flex-1">
                                    <h4 className={`font-semibold ${isSelected ? '' : ''}`}>{service.name}</h4>
                                    <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                                </div>
                            </div>

                            {isSelected && <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-primary" />}
                        </label>
                    );
                })}
            </div>
            {/* Bandwidth Selection (Only for Broadband) */}
            {(formData.serviceType === '1457567289' || formData.serviceType === '180427974') && !hasActiveSurvey && (
                <div className="mt-6">
                    <BandwidthSelector
                        residentialOptions={residentialOptions}
                        enterpriseOptions={enterpriseOptions}
                        loading={loadingBandwidths}
                        selectedBandwidth={formData.bandwidth}
                        onBandwidthChange={handleBandwidthChange}
                    />
                </div>
            )}

            {/* Device selection only available for Internet and Combo services */}
            {(formData.serviceType === '1457567289' || formData.serviceType === '180427974') && (
                <DeviceOptionSelector
                    value={formData.withDevice}
                    serviceType={formData.serviceType}
                    onChange={(val) => {
                        const isCombo = formData.serviceType === '180427974';
                        // If switching to "without device", clear all selected devices
                        if (!val) {
                            if (isCombo) {
                                onUpdate({
                                    withDevice: false,
                                    selectedDeviceInternet: null,
                                    selectedDeviceVoice: null,
                                    deviceId: null,
                                    deviceVoiceId: null,
                                });
                            } else {
                                onUpdate({
                                    withDevice: false,
                                    selectedDevice: null,
                                    deviceId: null,
                                });
                            }
                        } else {
                            onUpdate({ withDevice: true });
                        }
                    }}
                    selectedDevice={formData.selectedDevice}
                    selectedDeviceInternet={formData.selectedDeviceInternet}
                    selectedDeviceVoice={formData.selectedDeviceVoice}
                    onDeviceSelect={(device) => {
                        // Single service device selection
                        onUpdate({
                            selectedDevice: device,
                            deviceId: device.id,
                        });
                    }}
                    onInternetDeviceSelect={(device) => {
                        // Combo internet device selection
                        onUpdate({
                            selectedDeviceInternet: device,
                            deviceId: device.id,
                        });
                    }}
                    onVoiceDeviceSelect={formData.serviceType === '180427974' ? undefined : (device) => {
                        // Voice device selection (not used for combo)
                        onUpdate({
                            selectedDeviceVoice: device,
                            deviceVoiceId: device.id,
                        });
                    }}
                    disabled={hasActiveSurvey}
                />
            )}

            {/* Terms and Conditions Checkbox */}
            <div>
                <div>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="terms-acceptance"
                            checked={formData.termsAccepted || false}
                            onCheckedChange={(checked) => onUpdate({ termsAccepted: checked === true })}
                            disabled={hasActiveSurvey}
                            className="mt-1 border-primary"
                        />
                        <label
                            htmlFor="terms-acceptance"
                            className={`flex-1 cursor-pointer text-sm leading-relaxed ${hasActiveSurvey ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <span>
                                I accept the{' '}
                                <Link
                                    href={route('terms')}
                                    className="font-medium text-primary underline hover:text-primary/80"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Terms and Conditions
                                </Link>{' '}
                                and agree to the service agreement. By proceeding, I acknowledge that I have read and understood the terms of service.
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {hasActiveSurvey && (
                <Card className="bg-gray-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-blue-800">Active Service Request</p>
                                <p className="text-sm text-blue-700">
                                    You currently have an active service request in progress. Please complete or cancel your existing request before
                                    creating a new one.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
