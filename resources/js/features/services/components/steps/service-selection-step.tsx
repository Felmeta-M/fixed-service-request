import { BroadbandIcon, ComboIcon } from '@/components/icons/service-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BandwidthSelector } from '@/features/surveys/components/bandwidth-selector';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { useServiceTypes } from '@/hooks/use-service-types';
import fixedVoiceIcon from '@/images/fixed-voice.png';
import { Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

interface ServiceSelectionStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    hasActiveSurvey: boolean;
}

// Icon mapping for dynamic service types (Broadband & Combo use Figma SVGs; Voice keeps image)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Wifi: (props) => <BroadbandIcon className={props.className ?? 'h-6 w-6 sm:h-8 sm:w-8'} />,
    Phone: () => <img src={fixedVoiceIcon} alt="Fixed Voice" className="h-6 w-6 sm:h-8 sm:w-8" />,
    Package: (props) => <ComboIcon className={props.className ?? 'h-6 w-6 sm:h-8 sm:w-8'} />,
};

export function ServiceSelectionStep({ formData, onUpdate, hasActiveSurvey }: ServiceSelectionStepProps) {
    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths } = useBandwidthOptions();
    const { serviceTypes, loading: loadingServiceTypes } = useServiceTypes();

    // Transform service types for rendering
    const transformedServiceTypes = useMemo(() => {
        return (
            serviceTypes
                // Filter out "Fixed Voice" (code: 1207609454) to only show Broadband and Combo
                .filter((st) => st.code !== '1207609454')
                .map((st) => ({
                    value: st.code,
                    name: st.name,
                    description: st.description || '',
                    icon: iconMap[st.icon || 'Wifi'] || BroadbandIcon,
                    color: st.color || 'blue',
                    recommended: st.recommended,
                }))
        );
    }, [serviceTypes]);

    const handleServiceSelect = (serviceId: string) => {
        if (hasActiveSurvey) return; // Prevent selection if there's an active survey

        // Update service type without clearing device data
        // Voice services now support device selection
        onUpdate({ serviceType: serviceId });
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
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed bg-gray-50/50 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium text-gray-500">Loading service types...</span>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 duration-500 animate-in fade-in slide-in-from-bottom-4">
            {/* Service Type Selection Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                {transformedServiceTypes.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.serviceType === service.value;
                    const isRecommended = service.recommended;

                    return (
                        <div key={service.value} className="relative">
                            {/* Recommended Badge */}
                            {/* {isRecommended && (
                                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 transform">
                                    <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 shadow-sm">
                                        ✨ Recommended
                                    </span>
                                </div>
                            )} */}

                            <label
                                onClick={() => !hasActiveSurvey && handleServiceSelect(service.value)}
                                className={`group relative flex h-full cursor-pointer flex-col rounded-xl border-2 p-6 transition-all duration-200 ${
                                    hasActiveSurvey
                                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                                        : isSelected
                                          ? 'border-primary shadow-sm ring-1 ring-primary/20'
                                          : 'border-gray-100 bg-white shadow-sm hover:border-primary/50 hover:shadow-md'
                                } `}
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

                                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                                    <div
                                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center transition-colors duration-200 sm:h-8 sm:w-8 ${isSelected ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}
                                    >
                                        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                                            <h4 className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                                {service.name}
                                            </h4>
                                            {isSelected && <CheckCircle className="h-5 w-5 text-primary duration-300 animate-in zoom-in" />}
                                        </div>
                                        <p className="text-sm leading-relaxed text-gray-500">{service.description}</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    );
                })}
            </div>

            {/* Bandwidth Selection (Only for Broadband) - Smooth Reveal */}
            {(formData.serviceType === '1457567289' || formData.serviceType === '102647257') && !hasActiveSurvey && (
                <div className="mt-4 duration-500 animate-in fade-in fill-mode-forwards slide-in-from-top-4">
                    {/* <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"> */}
                    <BandwidthSelector
                        residentialOptions={residentialOptions}
                        enterpriseOptions={enterpriseOptions}
                        loading={loadingBandwidths}
                        selectedBandwidth={formData.bandwidth}
                        onBandwidthChange={handleBandwidthChange}
                    />
                    {/* </div> */}
                </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="terms-acceptance"
                        checked={formData.termsAccepted || false}
                        onCheckedChange={(checked) => onUpdate({ termsAccepted: checked === true })}
                        disabled={hasActiveSurvey}
                        className="mt-0.5 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <label
                        htmlFor="terms-acceptance"
                        className={`flex-1 cursor-pointer text-sm leading-relaxed text-gray-600 ${hasActiveSurvey ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        <span>
                            I have read and accept the{' '}
                            <Link
                                href={route('terms')}
                                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Terms and Conditions
                            </Link>{' '}
                            and service agreement. By proceeding, I acknowledge that I understand the terms of service.
                        </span>
                    </label>
                </div>
            </div>

            {/* Active Survey Warning */}
            {hasActiveSurvey && (
                <div className="duration-300 animate-in fade-in zoom-in">
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 shadow-none">
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                                <div>
                                    <h5 className="font-semibold text-blue-900">Active Service Request</h5>
                                    <p className="mt-1 text-sm text-blue-700">
                                        You currently have an active service request in progress. Please complete or cancel your existing request
                                        before creating a new one.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
