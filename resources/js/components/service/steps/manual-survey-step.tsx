import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    api_token?: string;
}

interface ManualSurveyStepProps {
    formData: {
        serviceType?: string;
        bandwidth?: string;
        customerType?: string;
        withDevice?: boolean;
        latitude?: number;
        longitude?: number;
        address?: string;
        contactPerson?: string;
        contactNo?: string;
        contactEmail?: string;
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
        distance?: string;
        cable_type?: string;
        neid?: string;
        nename?: string;
    };
    onBack: () => void;
    onUpdate?: (data: Partial<typeof formData>) => void;
}

export function ManualSurveyStep({ formData, onBack, onUpdate }: ManualSurveyStepProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const [manualFlowData, setManualFlowData] = useState({
        phone: (user as AuthUser)?.phone || '',
        name: (user as AuthUser)?.name || '',
    });

    const [address, setAddress] = useState(formData.address || '');
    const [manualFlowErrors, setManualFlowErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Sync address with formData when it changes
    useEffect(() => {
        setAddress(formData.address || '');
    }, [formData.address]);

    // Initialize form data from user if not provided
    useEffect(() => {
        if (user) {
            setManualFlowData({
                phone: (user as AuthUser)?.phone || '',
                name: (user as AuthUser)?.name || '',
            });
        }
    }, [user]);

    // Validate phone number format
    const validatePhoneNumber = (phone: string): string => {
        if (!phone.trim()) {
            return 'Phone number is required';
        }
        const phoneRegex = /^[+]?[\d\s-]{9,15}$/;
        const cleanedPhone = phone.replace(/[\s-]/g, '');
        if (!phoneRegex.test(cleanedPhone)) {
            return 'Please enter a valid phone number (9-15 digits)';
        }
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setManualFlowErrors({});
        setSubmitting(true);

        // Validate phone number
        const phoneError = validatePhoneNumber(manualFlowData.phone);
        if (phoneError) {
            setManualFlowErrors({ phone: phoneError });
            setSubmitting(false);
            return;
        }

        // Validate address
        if (!address || !address.trim()) {
            setManualFlowErrors({ address: 'Location address is required' });
            setSubmitting(false);
            return;
        }

        // Validate location coordinates
        if (!formData.latitude || !formData.longitude || formData.latitude === 0 || formData.longitude === 0) {
            setManualFlowErrors({ address: 'Please select a valid location on the map' });
            setSubmitting(false);
            return;
        }

        const submissionToast = toast.loading('Creating your service request...', {
            description: 'Please wait while we process your manual request',
        });

        try {
            // Build survey creation payload (same structure as review-submit-step)
            const encryptedResource = formData.resourceData;

            const submitData = {
                customer_code: (user as AuthUser)?.customer_code?.toString() || '',
                customer_type: formData.customerType || 'residential',
                survey_type: 'EIC08',
                telecom_region: '104',
                oper_type: 'A',
                main_offer_id: formData.serviceType,
                bandwidth: formData.bandwidth,
                contact_person: manualFlowData.name.trim() || formData.contactPerson || (user as AuthUser)?.name || 'Customer',
                contact_no: manualFlowData.phone.trim() || formData.contactNo || (user as AuthUser)?.phone || '',
                contact_email: formData.contactEmail || (user as AuthUser)?.email || '',
                survey_address_info: {
                    region_city: '2',
                    subcity_zone: '11',
                    wereda_town: '141',
                    kebele: '',
                    // Use encrypted values from resource-check (required by BaseSurveyService::decrypt)
                    latitude: encryptedResource?.latitude ?? String(formData.latitude),
                    longitude: encryptedResource?.longitude ?? String(formData.longitude),
                    address: address.trim(), // Use edited address
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
                survey_is_manual: true, // Mark as manual survey
            };

            // Create survey via the same API as normal flow
            const response = await axios.post('/api/v1/survey/create', submitData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(user as AuthUser)?.api_token}`,
                },
            });

            const isSurveySuccess = response.data.success && response.data.data?.original?.success !== false;

            if (!isSurveySuccess) {
                const errorMsg =
                    response.data.data?.original?.message ||
                    response.data.message ||
                    'Failed to create service request. Please try again.';
                throw new Error(errorMsg);
            }

            const responseData = response.data.data;
            const { customer_survey_order_id: surveyId } = responseData;

            // Save to local storage
            const serviceTypes: Record<string, string> = {
                '1457567289': 'Fixed Broadband',
                '1207609454': 'Fixed Voice',
                '180427974': 'Combo Services',
            };
            const newSurvey = {
                id: surveyId,
                type: serviceTypes[formData.serviceType || ''] || 'Service Request',
                status: 'waiting',
                createdAt: new Date().toISOString(),
                main_offer_id: formData.serviceType,
            };

            const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
            existingSurveys.push(newSurvey);
            localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));

            toast.success('Service request created successfully!', {
                id: submissionToast,
                description: 'Your manual request has been submitted. Our team will review your location and contact you within 1-2 business days.',
                duration: 5000,
            });

            // Navigate to services page after a brief delay
            setTimeout(() => {
                router.visit(route('services'));
            }, 1500);
        } catch (error: any) {
            console.error('Manual survey creation error:', error);

            let errorMessage = 'Failed to create your service request. Please try again.';
            let errorDescription = 'An unexpected error occurred.';

            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.errors) {
                    // Handle validation errors
                    const errors = error.response.data.errors;
                    const firstError = Object.values(errors)[0];
                    errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
                    errorDescription = 'Please check the form and correct any errors.';
                    setManualFlowErrors(errors);
                } else if (error.response?.status === 422) {
                    errorMessage = 'Validation error';
                    errorDescription = 'Please check your input and try again.';
                } else if (error.response?.status === 401) {
                    errorMessage = 'Authentication required';
                    errorDescription = 'Please log in and try again.';
                } else if (error.response?.status === 500) {
                    errorMessage = 'Server error';
                    errorDescription = 'Our servers encountered an issue. Please try again later.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {
                id: submissionToast,
                description: errorDescription,
                duration: 5000,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const serviceTypes: Record<string, string> = {
        '1457567289': 'Fixed Broadband',
        '1207609454': 'Fixed Voice',
        '180427974': 'Combo Services',
    };

    return (
        <div className="space-y-4">
            {/* Info Card */}
            <div className="border-amber-200 bg-amber-50 p-2">
                <div className="">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-900 mb-2">Location Review Needed</h3>
                            <p className="text-sm text-amber-800">
                                We're currently unable to automatically provision service for this location because
                                available resources could not be confirmed. Our team will review your location,
                                perform a manual survey if needed, and contact you to assist with the next steps.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                {/* <div>
                    <div>
                        <div className="font-semibold text-lg">Contact Information</div>
                        <div className="text-sm text-gray-500">Please provide your contact details for our team to reach you</div>
                    </div>
                    <div>
                        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="manual-phone">
                                    Contact Phone Number <span className="text-red-500">*</span>
                                </FieldLabel>
                                <Input
                                    id="manual-phone"
                                    type="tel"
                                    placeholder="+251 9XX XXX XXX"
                                    value={manualFlowData.phone}
                                    onChange={(e) => {
                                        setManualFlowData({ ...manualFlowData, phone: e.target.value });
                                        if (manualFlowErrors.phone) {
                                            setManualFlowErrors({ ...manualFlowErrors, phone: '' });
                                        }
                                    }}
                                    className={manualFlowErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                    disabled={submitting}
                                    required
                                />
                                {manualFlowErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{manualFlowErrors.phone}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="manual-name">Full Name</FieldLabel>
                                <Input
                                    id="manual-name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={manualFlowData.name}
                                    onChange={(e) => {
                                        setManualFlowData({ ...manualFlowData, name: e.target.value });
                                        if (manualFlowErrors.name) {
                                            setManualFlowErrors({ ...manualFlowErrors, name: '' });
                                        }
                                    }}
                                    className={manualFlowErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                    disabled={submitting}
                                />
                                {manualFlowErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{manualFlowErrors.name}</p>
                                )}
                            </Field>
                        </FieldGroup>
                    </div>
                </div> */}

                <div className="mt-4">
                    <div className="mb-2">
                        {/* <div className="font-semibold text-lg">Service Information</div>
                        <div className="text-sm text-gray-500">Your selected service details</div> */}
                        {/* <div className="font-semibold text-lg">Manual Survey Information</div>
                        <div className="text-sm text-gray-500">Please provide your contact details for our team to reach you</div> */}
                    </div>
                    <div >
                        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.serviceType && (
                                <Field>
                                    <FieldLabel>Service Type</FieldLabel>
                                    <Input
                                        type="text"
                                        value={serviceTypes[formData.serviceType] || 'Unknown'}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </Field>
                            )}

                            {formData.bandwidth && (
                                <Field>
                                    <FieldLabel>Bandwidth</FieldLabel>
                                    <Input
                                        type="text"
                                        value={formData.bandwidth}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </Field>
                            )}

                            <Field>
                                <FieldLabel>Customer Type</FieldLabel>
                                <Input
                                    type="text"
                                    value={formData.customerType ? formData.customerType.charAt(0).toUpperCase() + formData.customerType.slice(1) : 'Residential'}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </Field>

                            <Field>
                                <FieldLabel>Device Option</FieldLabel>
                                <Input
                                    type="text"
                                    value={
                                        formData.withDevice === undefined
                                            ? 'Not selected'
                                            : formData.withDevice
                                              ? 'With Device'
                                              : 'Without Device'
                                    }
                                    disabled
                                    className="bg-gray-50"
                                />
                            </Field>
                        </FieldGroup>
                    </div>
                </div>

                <div className="mt-2">
                    {/* <div>
                        <div className="font-semibold text-lg">Location Information</div>
                        <div className="text-sm text-gray-500">Your selected location details - you can edit the address to be more specific</div>
                    </div> */}
                    <div>
                        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="manual-phone">
                                    Contact Phone Number <span className="text-red-500">*</span>
                                </FieldLabel>
                                <Input
                                    id="manual-phone"
                                    type="tel"
                                    placeholder="+251 9XX XXX XXX"
                                    value={manualFlowData.phone}
                                    onChange={(e) => {
                                        setManualFlowData({ ...manualFlowData, phone: e.target.value });
                                        if (manualFlowErrors.phone) {
                                            setManualFlowErrors({ ...manualFlowErrors, phone: '' });
                                        }
                                    }}
                                    className={manualFlowErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                    disabled={submitting}
                                    required
                                />
                                {manualFlowErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{manualFlowErrors.phone}</p>
                                )}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="manual-address">
                                    Address <span className="text-red-500">*</span>
                                </FieldLabel>
                                <Textarea
                                    id="manual-address"
                                    rows={3}
                                    placeholder="Enter your specific location address"
                                    value={address}
                                    onChange={(e) => {
                                        const newAddress = e.target.value;
                                        setAddress(newAddress);
                                        // Update parent formData
                                        if (onUpdate) {
                                            onUpdate({ address: newAddress });
                                        }
                                        // Clear error if exists
                                        if (manualFlowErrors.address) {
                                            setManualFlowErrors({ ...manualFlowErrors, address: '' });
                                        }
                                    }}
                                    className={manualFlowErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                    disabled={submitting}
                                    required
                                />
                                {manualFlowErrors.address && (
                                    <p className="mt-1 text-sm text-red-600">{manualFlowErrors.address}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    You can edit this address to provide more specific location details
                                </p>
                            </Field>

                            {/* <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel>Latitude</FieldLabel>
                                    <Input
                                        type="text"
                                        value={formData.latitude?.toFixed(6) || ''}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Longitude</FieldLabel>
                                    <Input
                                        type="text"
                                        value={formData.longitude?.toFixed(6) || ''}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </Field>
                            </div> */}
                        </FieldGroup>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-between pt-2 gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={submitting}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Location
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Request...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Submit Request
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

