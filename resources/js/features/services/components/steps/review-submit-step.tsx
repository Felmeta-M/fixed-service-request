import { BroadbandIcon, ComboIcon } from '@/components/icons/service-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCreateSurvey } from '@/hooks/use-api-mutations';
import { useTranslation } from '@/hooks/use-translation';
import { useServiceFormStore } from '@/store/service-form-store';
import { usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Globe, HandHelping, Loader2, Phone, Router, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReviewSubmitStepProps {
    onBack: () => void;
    onNext?: (surveyId: string) => void;
}

const serviceTypes = {
    '1457567289': { name: 'Fixed Broadband', icon: BroadbandIcon, color: 'blue' },
    '1207609454': { name: 'Fixed Voice', icon: Phone, color: 'green' },
    '102647257': { name: 'Combo Services', icon: ComboIcon, color: 'purple' },
};

export function ReviewSubmitStep({ onBack, onNext }: ReviewSubmitStepProps) {
    type AuthUser = {
        api_token: string;
        customer_code: string | number;
        name: string;
        phone: string;
        email?: string;
        enterprise_name?: string;
    };

    // ── Zustand store ─────────────────────────────────────────────────────
    const formData = useServiceFormStore((s) => s.formData);

    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);

    const serviceInfo = serviceTypes[formData.serviceType as keyof typeof serviceTypes];
    const createSurveyMutation = useCreateSurvey();

    const handleSubmit = async () => {
        setSubmitting(true);

        const encryptedResource = formData.resourceData;

        const requiredEncryptedFields = ['neid', 'distance', 'cable_type', 'latitude', 'longitude', 'area_code', 'area_name'];
        const missingFields: string[] = [];

        if (!encryptedResource) {
            setSubmitting(false);
            toast.error('Location information is required', {
                description: 'Please go back and select your location again.',
            });
            return;
        }

        for (const field of requiredEncryptedFields) {
            const fieldValue = (encryptedResource as any)[field];
            if (!fieldValue || fieldValue === '') {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            setSubmitting(false);
            toast.error('Invalid location information', {
                description: 'Please go back and select your location again to ensure all required information is available.',
            });
            return;
        }

        const submitData = {
            main_offer_id: formData.serviceType,
            survey_address_info: {
                region_city: '2',
                subcity_zone: '11',
                wereda_town: '141',
                kebele: '',
                house_no: '',
                address: formData.address || '',
                latitude: encryptedResource.latitude,
                longitude: encryptedResource.longitude,
                distance: encryptedResource.distance,
                cable_type: encryptedResource.cable_type,
                neid: encryptedResource.neid,
                nename: encryptedResource.nename || '',
                area_code: (encryptedResource as any).area_code ?? '',
                area_name: (encryptedResource as any).area_name ?? '',
            },

            ...(formData.bandwidth && { bandwidth: formData.bandwidth }),
            ...(formData.withDevice !== undefined && { with_device: formData.withDevice }),
            ...(formData.serviceType === '1207609454' && formData.deviceVoiceId && { device_id: formData.deviceVoiceId }),
            ...(formData.serviceType === '1457567289' && formData.deviceId && { device_id: formData.deviceId }),
            ...(formData.serviceType === '102647257' && formData.deviceId && { device_id: formData.deviceId }),
            ...(formData.serviceType === '102647257' && formData.deviceVoiceId && { device_voice_id: formData.deviceVoiceId }),

            ...(formData.contactPerson && { contact_person: formData.contactPerson }),
            ...(formData.contactNo && { contact_no: formData.contactNo }),
            ...(formData.contactEmail && { contact_email: formData.contactEmail }),
        };

        const submissionToast = toast.loading('Creating service request...');

        createSurveyMutation.mutate(submitData, {
            onSuccess: (response) => {
                const responseData = response.data;

                const { customer_survey_order_id: surveyId } = responseData;

                const newSurvey = {
                    id: surveyId,
                    type: serviceInfo?.name || 'Service Request',
                    status: 'waiting',
                    createdAt: new Date().toISOString(),
                    main_offer_id: formData.serviceType,
                };

                const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                existingSurveys.push(newSurvey);
                localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

                toast.success('Service request created successfully!', {
                    id: submissionToast,
                    description: 'Your service request has been submitted and is now being processed.',
                    duration: 5000,
                });

                setSubmitting(false);
                onNext?.(String(surveyId));
            },
            onError: (err: Error) => {
                setSubmitting(false);
                const errorMessage = err.message || 'Failed to create your service request. Please try again.';
                toast.error(errorMessage, {
                    id: submissionToast,
                    duration: 5000,
                });
            },
        });
    };

    const ServiceIcon = serviceInfo?.icon || BroadbandIcon;

    return (
        <div className="w-full max-w-full space-y-6 overflow-x-hidden">
            {/* Review Summary */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Service Details Card */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="mb-2 flex items-center gap-3 border-b border-border/50 pb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-primary/20">
                                <HandHelping className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Service Details</h3>
                                <p className="text-xs text-muted-foreground">Service configuration and preferences</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Service Type */}
                            <div className="flex flex-row justify-between gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">Service Type</span>
                                </div>
                                <Badge variant="outline" className="w-fit text-primary hover:bg-primary/20">
                                    {serviceInfo?.name}
                                </Badge>
                            </div>

                            {/* Bandwidth - only for Internet and Combo services */}
                            {(formData.serviceType === '1457567289' || formData.serviceType === '102647257') && (
                                <div className="flex flex-row justify-between gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <BroadbandIcon className="h-4 w-4 shrink-0 text-primary" />
                                        <span className="text-sm font-medium text-muted-foreground">Bandwidth</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{formData.bandwidth || '-'}</p>
                                </div>
                            )}

                            {/* Device info - only for Internet and Combo services */}
                            {(formData.serviceType === '1457567289' || formData.serviceType === '102647257') && (
                                <div className="flex flex-col gap-2 border-t border-border/50 pt-2">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Router className="h-4 w-4 shrink-0 text-primary" />
                                        <span className="text-sm font-medium text-muted-foreground">Device</span>
                                    </div>
                                    <div className="pl-6">
                                        {formData.withDevice === undefined ? (
                                            <p className="text-sm text-muted-foreground">Not selected</p>
                                        ) : formData.withDevice ? (
                                            formData.serviceType === '102647257' ? (
                                                // Combo service - show internet and/or voice device(s)
                                                <div className="space-y-3">
                                                    {formData.selectedDeviceInternet ? (
                                                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                                            <p className="mb-1 text-xs font-medium text-muted-foreground">Internet/Data</p>
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {formData.selectedDeviceInternet.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formData.selectedDeviceInternet.vendor}
                                                                {formData.selectedDeviceInternet.model &&
                                                                    ` • ${formData.selectedDeviceInternet.model}`}
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold text-primary">
                                                                {new Intl.NumberFormat('en-ET', {
                                                                    style: 'currency',
                                                                    currency: 'ETB',
                                                                    minimumFractionDigits: 0,
                                                                    maximumFractionDigits: 2,
                                                                }).format(formData.selectedDeviceInternet.price)}
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                    {formData.selectedDeviceVoice ? (
                                                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                                            <p className="mb-1 text-xs font-medium text-muted-foreground">Voice/Phone</p>
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {formData.selectedDeviceVoice.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formData.selectedDeviceVoice.vendor}
                                                                {formData.selectedDeviceVoice.model && ` • ${formData.selectedDeviceVoice.model}`}
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold text-primary">
                                                                {new Intl.NumberFormat('en-ET', {
                                                                    style: 'currency',
                                                                    currency: 'ETB',
                                                                    minimumFractionDigits: 0,
                                                                    maximumFractionDigits: 2,
                                                                }).format(formData.selectedDeviceVoice.price)}
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                    {!formData.selectedDeviceInternet && !formData.selectedDeviceVoice && (
                                                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                            No device selected
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : formData.selectedDevice ? (
                                                // Single service device
                                                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                                    <p className="text-sm font-semibold text-foreground">{formData.selectedDevice.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formData.selectedDevice.vendor}
                                                        {formData.selectedDevice.model && ` • ${formData.selectedDevice.model}`}
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-primary">
                                                        {new Intl.NumberFormat('en-ET', {
                                                            style: 'currency',
                                                            currency: 'ETB',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2,
                                                        }).format(formData.selectedDevice.price)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                    With Device (Not selected)
                                                </Badge>
                                            )
                                        ) : (
                                            <Badge variant="outline" className="w-fit">
                                                Without Device
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Details Card */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="mb-2 flex items-center gap-3 border-b border-border/50 pb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-primary/20">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                                <p className="text-xs text-muted-foreground">Contact person and communication details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            <div className="row flex flex-col justify-between gap-2 sm:flex">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">Contact Person</span>
                                </div>
                                <p className="pl-6 text-sm font-semibold text-foreground">{formData.contactPerson || user.name || 'Customer'}</p>
                            </div>
                            <div className="row flex flex-col justify-between gap-2 sm:flex">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                </div>
                                <p className="pl-6 text-sm font-semibold text-foreground">{formData.contactNo || user.phone || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Actions */}
            <div className="mt-2 flex justify-between border-t border-border/50 pt-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={submitting || createSurveyMutation.isPending}
                    className="flex items-center space-x-2 text-[#068BCC]"
                >
                    <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
                    <span>{t('common.back')}</span>
                </Button>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting || createSurveyMutation.isPending || !formData.resourceAvailable}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary/20"
                >
                    {submitting || createSurveyMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                            <span>{t('buttons.processing')}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4 shrink-0" />
                            <span>{t('buttons.submit_request')}</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
