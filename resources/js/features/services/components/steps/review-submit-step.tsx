import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePage } from '@inertiajs/react';
import { CheckCircle, Loader2, Wifi, MapPin, User, Phone, Building2, Router, Globe, PhoneCall, HandHelping } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateSurvey } from '@/hooks/use-api-mutations';

interface ReviewSubmitStepProps {
    formData: {
        serviceType: string;
        bandwidth?: string;
        customerType?: string;
        withDevice?: boolean;
        selectedDevice?: {
            id: string;
            name: string;
            vendor: string;
            model: string | null;
            price: number;
            description: string | null;
        } | null;
        selectedDeviceInternet?: {
            id: string;
            name: string;
            vendor: string;
            model: string | null;
            price: number;
            description: string | null;
        } | null;
        selectedDeviceVoice?: {
            id: string;
            name: string;
            vendor: string;
            model: string | null;
            price: number;
            description: string | null;
        } | null;
        deviceId?: string | null;
        deviceVoiceId?: string | null;
        latitude: number;
        longitude: number;
        distance?: string;
        cable_type?: string;
        address?: string;
        contactPerson?: string;
        contactNo?: string;
        contactEmail?: string;
        resourceAvailable?: boolean;
        resourceData?: {
            distance: string;
            ava_port: string;
            neid: string;
            nename: string;
            typeid: string;
            longitude: string;
            latitude: string;
            cable_type: string;
            cable_type_desc: string;
            area_code: string;
            area_name: string;
        };
    };
    onBack: () => void;
    onNext?: (surveyId: string) => void;
}

const serviceTypes = {
    '1457567289': { name: 'Fixed Broadband', icon: Wifi, color: 'blue' },
    '1207609454': { name: 'Fixed Voice', icon: Wifi, color: 'green' },
    '180427974': { name: 'Combo Services', icon: Wifi, color: 'purple' },
};

export function ReviewSubmitStep({ formData, onBack, onNext }: ReviewSubmitStepProps) {
    type AuthUser = {
        api_token: string;
        customer_code: string | number;
        name: string;
        phone: string;
        email?: string;
        enterprise_name?: string;
    };

    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;
    const [submitting, setSubmitting] = useState(false);
    const [waitingForProcessing, setWaitingForProcessing] = useState(false);

    const serviceInfo = serviceTypes[formData.serviceType as keyof typeof serviceTypes];
    const createSurveyMutation = useCreateSurvey();

    const handleSubmit = async () => {
        setSubmitting(true);

        // The backend expects ALL encrypted resource fields exactly as returned from `/api/v1/resource-check`.
        // All fields are critical and required - no fallbacks allowed.
        const encryptedResource = formData.resourceData;

        // Validate that all required encrypted fields are present
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

        // ============================================================
        // MINIMAL PAYLOAD - Backend applies defaults for omitted fields
        // Backend defaults (in BaseSurveyService::applyDefaults):
        //   survey_type: 'EIC08', oper_type: 'A', customer_type: 'residential',
        //   telecom_region: from area_code, contact_*: from customer profile,
        //   external_operid: '512', bandwidth: '10M', with_device: false
        // ============================================================
        const submitData = {
            // REQUIRED - Must be provided
            main_offer_id: formData.serviceType,
            survey_address_info: {
                // Address info (can use defaults from customer profile on backend)
                region_city: '2',
                subcity_zone: '11',
                wereda_town: '141',
                kebele: '',
                house_no: '',
                address: formData.address || '',
                // Encrypted resource fields - REQUIRED (from resource-check)
                latitude: encryptedResource.latitude,
                longitude: encryptedResource.longitude,
                distance: encryptedResource.distance,
                cable_type: encryptedResource.cable_type,
                neid: encryptedResource.neid,
                nename: encryptedResource.nename || '',
                area_code: (encryptedResource as any).area_code ?? '',
                area_name: (encryptedResource as any).area_name ?? '',
            },
            
            // OPTIONAL - Only send if different from defaults
            ...(formData.bandwidth && { bandwidth: formData.bandwidth }),
            ...(formData.withDevice !== undefined && { with_device: formData.withDevice }),
            // Device handling:
            // - Voice-only (1207609454): use device_id from deviceVoiceId
            // - Broadband (1457567289): use device_id from deviceId
            // - Combo (180427974): use device_id for internet, device_voice_id for voice
            ...(formData.serviceType === '1207609454' && formData.deviceVoiceId && { device_id: formData.deviceVoiceId }),
            ...(formData.serviceType === '1457567289' && formData.deviceId && { device_id: formData.deviceId }),
            ...(formData.serviceType === '180427974' && formData.deviceId && { device_id: formData.deviceId }),
            ...(formData.serviceType === '180427974' && formData.deviceVoiceId && { device_voice_id: formData.deviceVoiceId }),
            
            // Contact - only send if user provided custom values
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

                // Save to local storage
                const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                existingSurveys.push(newSurvey);
                localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

                toast.success('Service request created successfully!', {
                    id: submissionToast,
                    description: 'Your service request has been submitted and is now being processed.',
                    duration: 5000,
                });

                // Reset submitting since API call is complete
                setSubmitting(false);
                // Show waiting state while third-party processes the order
                setWaitingForProcessing(true);
                // Wait 7.5 seconds for third-party processing before transitioning
                setTimeout(() => {
                    setWaitingForProcessing(false);
                    onNext?.(String(surveyId));
                }, 7500); // 7.5 seconds - middle of 5-10 second range
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

    const ServiceIcon = serviceInfo?.icon || Wifi;

    return (
        <div className="w-full max-w-full space-y-6 overflow-x-hidden">
            {/* Header Section */}
            {/* <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                        <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Review & Submit</h2>
                        <p className="text-sm text-muted-foreground">Please review your service request details before submitting</p>
                    </div>
                </div>
            </div> */}

            {/* Review Summary */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Service Details Card */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="mb-2 flex items-center gap-3 border-b border-border/50 pb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg  ring-1 ring-primary/20">
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
                                    <Globe className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium text-muted-foreground">Service Type</span>
                                </div>
                                <Badge variant="outline" className="w-fit  text-primary hover:bg-primary/20">
                                    {serviceInfo?.name}
                                </Badge>
                            </div>

                            {/* Bandwidth - only for Internet and Combo services */}
                            {(formData.serviceType === '1457567289' || formData.serviceType === '180427974') && (
                                <div className="flex flex-row justify-between gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wifi className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm font-medium text-muted-foreground">Bandwidth</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{formData.bandwidth || '-'}</p>
                                </div>
                            )}

                            {/* Customer Type */}
                            {/* <div className="flex flex-row justify-between gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium text-muted-foreground">Customer Type</span>
                                </div>
                                <Badge variant="outline" className="w-fit capitalize">
                                    {formData.customerType || 'residential'}
                                </Badge>
                            </div> */}

                            {/* Device info - only for Internet and Combo services */}
                            {(formData.serviceType === '1457567289' || formData.serviceType === '180427974') && (
                                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Router className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm font-medium text-muted-foreground">Device</span>
                                    </div>
                                    <div className="pl-6">
                                        {formData.withDevice === undefined ? (
                                            <p className="text-sm text-muted-foreground">Not selected</p>
                                        ) : formData.withDevice ? (
                                            formData.serviceType === '180427974' ? (
                                                // Combo service - show only internet device
                                                <div className="space-y-2">
                                                    {formData.selectedDeviceInternet ? (
                                                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {formData.selectedDeviceInternet.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formData.selectedDeviceInternet.vendor}
                                                                {formData.selectedDeviceInternet.model && ` • ${formData.selectedDeviceInternet.model}`}
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
                                                    ) : (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                            Not selected
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : formData.selectedDevice ? (
                                                // Single service device
                                                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {formData.selectedDevice.name}
                                                    </p>
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
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                    With Device (Not selected)
                                                </Badge>
                                            )
                                        ) : (
                                            <Badge variant="outline" className="w-fit">Without Device</Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location Details (match Resource Details layout) */}
                {/* <Card>
                    <CardContent>
                        <h3 className="mb-4 font-semibold text-gray-900">Location</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4"> */}
                {/*<div>*/}
                {/*    <span className="text-sm text-gray-600">Latitude</span>*/}
                {/*    <p className="font-mono font-semibold">{formData.latitude.toFixed(6)}</p>*/}
                {/*</div>*/}
                {/*<div>*/}
                {/*    <span className="text-sm text-gray-600">Longitude</span>*/}
                {/*    <p className="font-mono font-semibold">{formData.longitude.toFixed(6)}</p>*/}
                {/*</div>*/}
                {/* <div>
                                <span className="text-sm text-gray-600">Resource</span>
                                <p className="font-semibold">
                                    <Badge className={formData.resourceAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {formData.resourceAvailable ? 'Available' : 'Not Available'}
                                    </Badge>
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Address</span> */}
                {/*<p className="font-semibold">{formData.address || '-'}</p>*/}
                {/* </div>
                        </div>
                    </CardContent>
                </Card> */}

                {/* Location Details Card */}
                {/* <Card className="w-full shadow-sm transition-all duration-300 hover:shadow-md">
                    <CardContent className="p-4 sm:p-6">
                        <div className="mb-5 flex items-center gap-3 border-b border-border/50 pb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Location Details</h3>
                                <p className="text-xs text-muted-foreground">Installation address and coordinates</p>
                            </div>
                        </div>

                        <div className="space-y-4"> */}
                            {/* Address */}
                            {/* {formData.address && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm font-medium text-muted-foreground">Address</span>
                                    </div>
                                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 pl-6">
                                        <p className="text-sm text-foreground break-words">{formData.address}</p>
                                    </div>
                                </div>
                            )} */}

                            {/* Coordinates */}
                            {/* <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Latitude</span>
                                    <p className="text-sm font-mono font-semibold text-foreground">
                                        {formData.latitude.toFixed(6)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Longitude</span>
                                    <p className="text-sm font-mono font-semibold text-foreground">
                                        {formData.longitude.toFixed(6)}
                                    </p>
                                </div>
                            </div> */}

                            {/* Resource Status */}
                            {/* {formData.resourceData && (
                                <div className="pt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Resource Status</span>
                                        <Badge
                                            className={
                                                formData.resourceAvailable
                                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                                                    : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100'
                                            }
                                        >
                                            {formData.resourceAvailable ? 'Available' : 'Review Needed'}
                                        </Badge>
                                    </div>
                                    {formData.resourceData.distance && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Distance: {formData.resourceData.distance}m
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card> */}

                {/* Contact Details Card */}
                <div className="w-full">
                    <div className="sm:p-4">
                        <div className="mb-2 flex items-center gap-3 border-b border-border/50 pb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg  ring-1 ring-primary/20">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                                <p className="text-xs text-muted-foreground">Contact person and communication details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            <div className="flex flex-col sm:flex row justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium text-muted-foreground">Contact Person</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground pl-6">{formData.contactPerson || user.name || 'Customer'}</p>
                            </div>
                            <div className="flex flex-col sm:flex row justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground pl-6">{formData.contactNo || user.phone || '-'}</p>
                            </div>
                            {/* {formData.contactEmail && (
                                <div className="flex flex-col sm:flex row justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <PhoneCall className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground pl-6 break-words">{formData.contactEmail}</p>
                                </div>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Details */}
            {/*{formData.resourceData && (*/}
            {/*    <Card>*/}
            {/*        <CardContent>*/}
            {/*            <h3 className="mb-4 font-semibold text-gray-900">Resource Details</h3>*/}
            {/*            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Available Ports</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.ava_port}</p>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Distance</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.distance}m</p>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Node ID</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.neid}</p>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <span className="text-sm text-gray-600">Technology</span>*/}
            {/*                    <p className="font-semibold">{formData.resourceData.cable_type_desc}</p>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*)}*/}


            {/* Submit Actions */}
            <div className="flex flex-row justify-between gap-3 border-t border-border/50 pt-6 sm:flex-row sm:justify-between sm:gap-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={submitting || createSurveyMutation.isPending || waitingForProcessing}
                    className="w-full sm:w-auto"
                >
                    Back
                </Button>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting || createSurveyMutation.isPending || waitingForProcessing || !formData.resourceAvailable}
                    className="w-full bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 sm:w-auto"
                >
                    {(submitting || createSurveyMutation.isPending || waitingForProcessing) ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                            <span>{waitingForProcessing ? 'Preparing subscription...' : 'Processing...'}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4 shrink-0" />
                            <span>Submit Request</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
