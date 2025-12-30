import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle, Loader2, Wifi } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReviewSubmitStepProps {
    formData: {
        serviceType: string;
        bandwidth?: string;
        customerType?: string;
        withDevice?: boolean;
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
    const [error, setError] = useState('');

    const serviceInfo = serviceTypes[formData.serviceType as keyof typeof serviceTypes];

    const handleSurveyRequest = async () => {
        // The backend expects encrypted resource fields (distance/cable_type/latitude/longitude)
        // exactly as returned from `/api/v1/resource-check`.
        const encryptedResource = formData.resourceData;

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
                // Use encrypted values from resource-check (required by BaseSurveyService::decrypt)
                latitude: encryptedResource?.latitude ?? String(formData.latitude),
                longitude: encryptedResource?.longitude ?? String(formData.longitude),
                address: formData.address || '',
                // Forward exact encrypted resource-check data
                distance: encryptedResource?.distance ?? formData.distance,
                cable_type: encryptedResource?.cable_type ?? formData.cable_type,
                neid: encryptedResource?.neid,
                nename: encryptedResource?.nename,

            },
            with_device: formData.withDevice,
            completed_date: new Date()
                .toISOString()
                .replace(/[-:T.Z]/g, '')
                .slice(0, 14),
            external_operid: '512',
            survey_is_manual: false, // Normal flow - resource is available
        };
        const response = await axios.post('/api/v1/survey/create', submitData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.api_token}`,
            },
        });

        const isSurveySuccess = response.data.success && response.data.data?.original?.success !== false;

        if (!isSurveySuccess) {
            const errorMsg = response.data.data?.original?.message || response.data.message || 'Failed to create service request';
            throw new Error(errorMsg);
        }

        return response;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        const submissionToast = toast.loading('Creating service request...');

        try {
            // 1. Create Survey
            const response = await handleSurveyRequest();
            console.log('🚀 ~ handleSubmit ~ response:', response);

            const responseData = response.data.data;
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

            onNext?.(String(surveyId));
            return;
        } catch (err: unknown) {
            console.error('Submission error:', err);

            let errorMessage = 'Failed to create your service request. Please try again.';
            let errorDescription = 'An unexpected error occurred.';

            if (axios.isAxiosError(err)) {
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const errors = err.response.data.errors;
                    const firstError = Object.values(errors)[0];
                    errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
                    errorDescription = 'Please check the form and correct any errors.';
                } else if (err.response?.status === 422) {
                    errorMessage = 'Validation error';
                    errorDescription = 'Please check your input and try again.';
                } else if (err.response?.status === 401) {
                    errorMessage = 'Authentication required';
                    errorDescription = 'Please log in and try again.';
                } else if (err.response?.status === 500) {
                    errorMessage = 'Server error';
                    errorDescription = 'Our servers encountered an issue. Please try again later.';
                } else if (err.message) {
                    errorMessage = err.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            toast.error(errorMessage, {
                id: submissionToast,
                description: errorDescription,
                duration: 5000,
            });
            return;
        } finally {
            setSubmitting(false);
        }
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
                                <p className="font-semibold">
                                    {formData.withDevice === undefined 
                                        ? "Not selected" 
                                        : formData.withDevice 
                                            ? "With Device" 
                                            : "Without Device"}
                                </p>
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

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Submit Actions */}
            <div className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} disabled={submitting}>
                    Back
                </Button>

                <Button onClick={handleSubmit} disabled={submitting || !formData.resourceAvailable} className="bg-primary hover:bg-primary/80">
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
