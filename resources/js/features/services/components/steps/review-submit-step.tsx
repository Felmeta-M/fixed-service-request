import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { CheckCircle, Loader2, Wifi } from 'lucide-react';
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
    console.log('user:', user);
    console.log('formData in ReviewSubmitStep:', formData);
    const [submitting, setSubmitting] = useState(false);

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

        const submitData = {
            customer_code: user.customer_code.toString(),
            customer_type: formData.customerType || 'residential',
            survey_type: 'EIC08',
            telecom_region: '104',
            oper_type: 'A',
            main_offer_id: formData.serviceType,
            bandwidth: formData.bandwidth,
            contact_person: formData.contactPerson || user.name,
            contact_no: formData.contactNo || user.phone,
            contact_email: formData.contactEmail || user.email || '',
            survey_address_info: {
                region_city: '2',
                subcity_zone: '11',
                wereda_town: '141',
                kebele: '',
                house_no: '', // Backend has fallback if not provided
                address: formData.address || '',
                // All fields are critical and must be encrypted from resource-check response
                // No fallbacks - validation ensures all fields are present above
                latitude: encryptedResource.latitude,
                longitude: encryptedResource.longitude,
                distance: encryptedResource.distance,
                cable_type: encryptedResource.cable_type,
                neid: encryptedResource.neid,
                nename: encryptedResource.nename || '',
                // Ensure area_code and area_name are always included (even if empty string)
                area_code: (encryptedResource as any).area_code ?? '',
                area_name: (encryptedResource as any).area_name ?? '',
            },
            with_device: formData.withDevice,
            device_id: formData.deviceId || null,
            device_voice_id: formData.deviceVoiceId || null, // For combo voice device
            completed_date: new Date()
                .toISOString()
                .replace(/[-:T.Z]/g, '')
                .slice(0, 14),
            external_operid: '512',
            survey_is_manual: false, // Normal flow - resource is available
        };

        const submissionToast = toast.loading('Creating service request...');

        createSurveyMutation.mutate(submitData, {
            onSuccess: (response) => {
                console.log('🚀 ~ handleSubmit ~ response:', response);

                const responseData = response.data;
                console.log("🚀 ~ handleSubmit ~ responseData:", responseData)

                const { customer_survey_order_id: surveyId } = responseData;
                console.log("🚀 ~ handleSubmit ~ surveyId:", surveyId)

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

                setSubmitting(false);
                onNext?.(String(surveyId));
            },
            onError: (err: Error) => {
                console.error('Submission error:', err);
                setSubmitting(false);
                const errorMessage = err.message || 'Failed to create your service request. Please try again.';
                toast.error(errorMessage, {
                    id: submissionToast,
                    duration: 5000,
                });
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Review Summary */}
            <div className="3xl:grid-cols-3 grid grid-cols-1 gap-6 lg:grid-cols-1">
                {/* Service Details (match Resource Details layout) */}
                <Card>
                    <CardContent>
                        <h3 className="mb-4 font-semibold text-gray-900">Service Details</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <span className="text-sm text-gray-600">Service Type</span>
                                <p className="font-semibold">{serviceInfo?.name}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Bandwidth</span>
                                <p className="font-semibold">{formData.bandwidth || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Customer Type</span>
                                <p className="font-semibold capitalize">{formData.customerType || 'residential'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Device</span>
                                <div className="font-semibold">
                                    {formData.withDevice === undefined ? (
                                        <p>Not selected</p>
                                    ) : formData.withDevice ? (
                                        formData.serviceType === '180427974' ? (
                                            // Combo service - show both devices
                                            <div className="space-y-1">
                                                {formData.selectedDeviceInternet ? (
                                                    <p>
                                                        Internet: {formData.selectedDeviceInternet.name} ({formData.selectedDeviceInternet.vendor}) -{' '}
                                                        {new Intl.NumberFormat('en-ET', {
                                                            style: 'currency',
                                                            currency: 'ETB',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2,
                                                        }).format(formData.selectedDeviceInternet.price)}
                                                    </p>
                                                ) : (
                                                    <p className="text-orange-600">Internet: Not selected</p>
                                                )}
                                                {formData.selectedDeviceVoice ? (
                                                    <p>
                                                        Voice: {formData.selectedDeviceVoice.name} ({formData.selectedDeviceVoice.vendor}) -{' '}
                                                        {new Intl.NumberFormat('en-ET', {
                                                            style: 'currency',
                                                            currency: 'ETB',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2,
                                                        }).format(formData.selectedDeviceVoice.price)}
                                                    </p>
                                                ) : (
                                                    <p className="text-orange-600">Voice: Not selected</p>
                                                )}
                                            </div>
                                        ) : formData.selectedDevice ? (
                                            // Single service device
                                            <p>
                                                {formData.selectedDevice.name} ({formData.selectedDevice.vendor}) -{' '}
                                                {new Intl.NumberFormat('en-ET', {
                                                    style: 'currency',
                                                    currency: 'ETB',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                }).format(formData.selectedDevice.price)}
                                            </p>
                                        ) : (
                                            <p className="text-orange-600">With Device (Not selected)</p>
                                        )
                                    ) : (
                                        <p>Without Device</p>
                                    )}
                                </div>
                            </div>

                            {/*<div>*/}
                            {/*    <span className="text-sm text-gray-600">Main Offer ID</span>*/}
                            {/*    <p className="font-semibold">{formData.serviceType || '-'}</p>*/}
                            {/*</div>*/}
                        </div>
                    </CardContent>
                </Card>

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

                {/* Contact Details (match Resource Details layout) */}
                <Card>
                    <CardContent>
                        <h3 className="mb-4 font-semibold text-gray-900">Contact</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <span className="text-sm text-gray-600">Contact Person</span>
                                <p className="font-semibold">{formData.contactPerson || 'Customer'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Phone</span>
                                <p className="font-semibold">{formData.contactNo || '-'}</p>
                            </div>
                            {/* <div>
                                <span className="text-sm text-gray-600">Email</span>
                                <p className="font-semibold">{formData.contactEmail || '-'}</p>
                            </div> */}
                            {/*<div>*/}
                            {/*    <span className="text-sm text-gray-600">Preferred</span>*/}
                            {/*    <p className="font-semibold">{formData.contactPreferred || '-'}</p>*/}
                            {/*</div>*/}
                        </div>
                    </CardContent>
                </Card>
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
            <div className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} disabled={submitting}>
                    Back
                </Button>

                <Button onClick={handleSubmit} disabled={submitting || createSurveyMutation.isPending || !formData.resourceAvailable} className="bg-primary hover:bg-primary/80">
                    {(submitting || createSurveyMutation.isPending) ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Next
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
