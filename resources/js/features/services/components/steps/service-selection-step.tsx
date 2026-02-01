import { BandwidthSelector } from '@/features/surveys/components/bandwidth-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useBandwidthOptions } from '@/hooks/use-bandwidth-options';
import { useServiceTypes } from '@/hooks/use-service-types';
import { Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Loader2, Package, Phone, Wifi } from 'lucide-react';
import { useMemo } from 'react';
import fixedVoiceIcon from '@/images/fixed-voice.png';

// SVG icons from Figma (Broadband, Combo)
function BroadbandIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M23.3136 18.3394V19.2039C23.2917 19.2181 23.2675 19.2399 23.2584 19.2846C22.9939 20.5769 21.8636 21.4806 20.539 21.4801H19.6736L19.669 22.4358C19.6672 22.8722 19.3471 23.1408 18.9814 23.2999H18.5031C18.1374 23.0756 17.8519 22.8863 17.8501 22.3456L17.8478 21.4792H5.4787L5.47095 22.4372C5.4673 22.874 5.14812 23.1412 4.78335 23.2999H4.30503C3.97536 23.0997 3.65527 22.8891 3.65482 22.3921L3.6539 21.4806L2.6991 21.4788C1.80676 21.4769 0.993311 21.0055 0.522748 20.3279C-0.0107387 19.5591 -0.172153 18.6057 0.208584 17.7562L2.20391 13.3037C2.93894 11.6416 4.5581 10.5596 6.39019 10.5592L16.0331 10.5573L16.034 0.914906C16.034 0.378683 16.4681 -0.0111724 16.9651 0.000682846C17.4621 0.0125381 17.8529 0.393274 17.8529 0.915818V10.6517C19.2978 10.9531 20.4879 11.9002 21.0916 13.238L23.1417 17.7822C23.231 17.9801 23.216 18.1784 23.3145 18.3394H23.3136ZM20.5946 19.6581C20.9685 19.6581 21.2202 19.441 21.3565 19.2213C21.5312 18.939 21.5312 18.6358 21.398 18.3412L19.4323 13.9903C18.9882 13.0073 18.0321 12.3799 16.9377 12.3799H6.38973C5.29586 12.3799 4.33923 13.0073 3.89511 13.9903L1.91893 18.3658C1.77986 18.6736 1.81087 19.0019 2.00557 19.276C2.15923 19.4926 2.41685 19.6594 2.75427 19.6594L20.5951 19.6581H20.5946Z" fill="currentColor" />
            <path d="M7.11278 7.80326C7.11278 8.34815 6.70195 8.7225 6.22364 8.73436C5.72754 8.74667 5.29346 8.35773 5.29346 7.82378V0.912623C5.29346 0.39464 5.70474 0.0111678 6.18078 0.0002245C6.65681 -0.0107188 7.11142 0.379593 7.11142 0.912623L7.11278 7.80372V7.80326Z" fill="currentColor" />
            <path d="M15.1202 16.0445C15.6391 15.9332 16.0973 16.272 16.1985 16.7367C16.3071 17.2332 15.9924 17.7165 15.4982 17.8214C15.023 17.9217 14.5484 17.6317 14.4285 17.1507C14.3085 16.6696 14.5871 16.1589 15.1202 16.0445Z" fill="currentColor" />
            <path d="M7.79327 16.0504C8.30715 15.915 8.77954 16.2351 8.90219 16.6974C9.03123 17.1844 8.73668 17.6801 8.25335 17.8077C7.77002 17.9354 7.29581 17.6595 7.15309 17.1926C7.009 16.7207 7.26662 16.189 7.79327 16.0504Z" fill="currentColor" />
            <path d="M11.4336 16.0504C11.9475 15.915 12.4199 16.2351 12.5426 16.6974C12.6716 17.1844 12.377 17.6801 11.8937 17.8077C11.4222 17.9322 10.9362 17.6595 10.7935 17.1926C10.6507 16.7257 10.907 16.189 11.4336 16.0504Z" fill="currentColor" />
        </svg>
    );
}

function ComboIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M2.76209 3.8147e-06C2.75603 0.0203862 2.77697 0.0550914 2.82875 0.0550914H12.3672C12.4184 0.0550914 12.4399 0.0203862 12.4338 3.8147e-06H12.5985C14.0826 0.255059 15.2185 1.40309 15.2169 2.96757L15.2146 5.28235L14.0551 5.28952L14.0396 2.91138C14.0336 1.93964 13.2442 1.19155 12.2631 1.1921H2.93286C1.92862 1.1921 1.15188 1.96883 1.15188 2.97363V12.3038C1.15133 13.3114 1.93358 14.0815 2.9268 14.0854L5.24875 14.0947L5.2526 15.2549L2.79129 15.2505C1.42842 15.2483 0.00716157 14.0958 0.00605982 12.5963L1.80274e-07 2.68057C-0.000550696 1.39041 1.26151 0.245695 2.48721 3.8147e-06H2.76209Z" fill="currentColor" />
            <path d="M22.2701 9.61665V9.83645C22.2498 9.83039 22.2151 9.85132 22.2151 9.90311V19.4415C22.2151 19.4928 22.2498 19.5142 22.2701 19.5082V19.7831C22.0173 21.0115 20.8957 22.2631 19.5885 22.2686L9.6336 22.3105C8.07848 22.0351 7.00592 20.8457 7.00978 19.2856L7.01584 17.0287L8.17598 17.021L8.18479 19.3446C8.18865 20.335 8.95988 21.1189 9.96688 21.1189H19.2965C20.3008 21.1184 21.0769 20.3422 21.0769 19.3374V10.0078C21.078 8.99967 20.2953 8.22954 19.3031 8.22569L16.9806 8.21687V7.06058L19.3042 7.05342C20.7778 7.04902 21.9914 8.11166 22.2217 9.5555C22.2283 9.59517 22.252 9.61224 22.2696 9.6172L22.2701 9.61665Z" fill="currentColor" />
            <path d="M12.434 3.8147e-06C12.44 0.0203862 12.4191 0.0550914 12.3673 0.0550914H2.82888C2.77765 0.0550914 2.75617 0.0203862 2.76223 3.8147e-06H12.434Z" fill="currentColor" />
            <path d="M22.2704 19.5082C22.25 19.5142 22.2153 19.4933 22.2153 19.4415V9.90311C22.2153 9.85188 22.25 9.83039 22.2704 9.83645V19.5082Z" fill="currentColor" />
            <path d="M13.455 15.256L8.80727 15.2598C7.79311 15.2609 7.00977 14.4759 7.00977 13.4634V8.84708C7.00977 7.83237 7.79201 7.05012 8.80727 7.05012H13.4225C14.4367 7.05012 15.2195 7.83237 15.2195 8.84708V13.4634C15.2195 14.4456 14.4747 15.2549 13.455 15.2554V15.256ZM13.4484 14.0821C13.8236 14.0821 14.0445 13.7956 14.0445 13.4612V8.84928C14.045 8.48075 13.7888 8.22459 13.4203 8.22459H8.80893C8.44039 8.22459 8.18423 8.48075 8.18423 8.84928V13.4607C8.18423 13.8281 8.44039 14.0859 8.80893 14.0854L13.4479 14.0815L13.4484 14.0821Z" fill="currentColor" />
        </svg>
    );
}

interface ServiceSelectionStepProps {
    formData: any;
    onUpdate: (data: any) => void;
    hasActiveSurvey: boolean;
}

// Icon mapping for dynamic service types (Broadband & Combo use Figma SVGs; Voice keeps image)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Wifi: (props) => <BroadbandIcon {...props} className={props.className ?? 'h-6 w-6 sm:h-8 sm:w-8'} />,
    Phone: () => <img src={fixedVoiceIcon} alt="Fixed Voice" className="h-6 sm:h-8 w-6 sm:w-8" />,
    Package: (props) => <ComboIcon {...props} className={props.className ?? 'h-6 w-6 sm:h-8 sm:w-8'} />,
};

export function ServiceSelectionStep({ formData, onUpdate, hasActiveSurvey }: ServiceSelectionStepProps) {
    const { residentialOptions, enterpriseOptions, loading: loadingBandwidths } = useBandwidthOptions();
    const { serviceTypes, loading: loadingServiceTypes } = useServiceTypes();

    // Transform service types for rendering
    const transformedServiceTypes = useMemo(() => {
        return serviceTypes
            // Filter out "Fixed Voice" (code: 1207609454) to only show Broadband and Combo
            .filter((st) => st.code !== '1207609454')
            .map((st) => ({
                value: st.code,
                name: st.name,
                description: st.description || '',
                icon: iconMap[st.icon || 'Wifi'] || Wifi,
                color: st.color || 'blue',
                recommended: st.recommended,
            }));
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
        <div className="mx-auto w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                className={`group relative flex h-full cursor-pointer flex-col rounded-xl border-2 p-6 transition-all duration-200 
                                    ${hasActiveSurvey
                                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                                        : isSelected
                                            ? 'border-primary shadow-sm ring-1 ring-primary/20'
                                            : 'border-gray-100 bg-white shadow-sm hover:border-primary/50 hover:shadow-md'
                                    }
                                `}
                            >
                                <input
                                    type="radio"
                                    name="serviceType"
                                    value={service.value}
                                    checked={isSelected}
                                    onChange={() => { }}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    disabled={hasActiveSurvey}
                                />

                                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                                    <div
                                        className={`flex h-6 sm:h-8 w-6 sm:w-8 flex-shrink-0 items-center justify-center transition-colors duration-200 
                                        ${isSelected ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}
                                    >
                                        <Icon className="h-6 sm:h-8 w-6 sm:w-8" />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                                            <h4 className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                                {service.name}
                                            </h4>
                                            {isSelected && <CheckCircle className="h-5 w-5 text-primary animate-in zoom-in duration-300" />}
                                        </div>
                                        <p className="text-sm leading-relaxed text-gray-500">
                                            {service.description}
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    );
                })}
            </div>

            {/* Bandwidth Selection (Only for Broadband) - Smooth Reveal */}
            {(formData.serviceType === '1457567289' || formData.serviceType === '102647257') && !hasActiveSurvey && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-forwards">
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
                <div className="animate-in fade-in zoom-in duration-300">
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 shadow-none">
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                                <div>
                                    <h5 className="font-semibold text-blue-900">Active Service Request</h5>
                                    <p className="mt-1 text-sm text-blue-700">
                                        You currently have an active service request in progress. Please complete or cancel your existing request before creating a new one.
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
