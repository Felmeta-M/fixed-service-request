import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { useCreateSurvey } from '@/hooks/use-api-mutations';

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    api_token?: string;
}

type FormData = {
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

interface ManualSurveyStepProps {
    formData: FormData;
    onBack: () => void;
    onUpdate?: (data: Partial<FormData>) => void;
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
    
    const createSurveyMutation = useCreateSurvey();

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

    // Map API field names to form field names
    const mapApiFieldToFormField = (apiField: string): string => {
        const fieldMap: Record<string, string> = {
            contact_no: 'phone',
            contact_person: 'name',
            survey_address_info: 'address',
            'survey_address_info.address': 'address',
            'survey_address_info.latitude': 'address',
            'survey_address_info.longitude': 'address',
        };
        return fieldMap[apiField] || apiField;
    };

    // Parse Laravel validation errors into form field errors
    const parseValidationErrors = (errors: Record<string, string | string[]>): Record<string, string> => {
        const formErrors: Record<string, string> = {};

        Object.entries(errors).forEach(([apiField, errorMessages]) => {
            const formField = mapApiFieldToFormField(apiField);
            // Handle both string and array formats
            const errorMessage = Array.isArray(errorMessages)
                ? errorMessages[0]
                : errorMessages;

            if (errorMessage) {
                formErrors[formField] = errorMessage;
            }
        });

        return formErrors;
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
            device_id: formData.deviceId || null,
            completed_date: new Date()
                .toISOString()
                .replace(/[-:T.Z]/g, '')
                .slice(0, 14),
            external_operid: '512',
            survey_is_manual: true, // Mark as manual survey
        };

        const submissionToast = toast.loading('Creating your service request...', {
            description: 'Please wait while we process your manual request',
        });

        createSurveyMutation.mutate(submitData, {
            onSuccess: (response) => {
                const responseData = response.data;
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
            },
            onError: (error: Error) => {
                console.error('Manual survey creation error:', error);
                toast.dismiss(submissionToast);

                let errorMessage = error.message || 'Failed to create your service request. Please try again.';
                let errorDescription = 'An unexpected error occurred.';
                let validationErrors: Record<string, string> = {};

                // Handle validation errors if they come in error data
                const errorData = (error as any).data;
                if (errorData?.errors) {
                    validationErrors = parseValidationErrors(errorData.errors);
                    setManualFlowErrors(validationErrors);
                    
                    errorMessage = 'Please correct the validation errors below.';
                    errorDescription = Object.keys(validationErrors).length > 0
                        ? `${Object.keys(validationErrors).length} field${Object.keys(validationErrors).length > 1 ? 's' : ''} need${Object.keys(validationErrors).length > 1 ? '' : 's'} attention.`
                        : 'Validation failed. Please check your input.';

                    // Scroll to first error field
                    const firstErrorField = Object.keys(validationErrors)[0];
                    if (firstErrorField) {
                        setTimeout(() => {
                            const errorElement = document.getElementById(`manual-${firstErrorField}`);
                            if (errorElement) {
                                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                errorElement.focus();
                            }
                        }, 100);
                    }
                } else {
                    // Show error toast for non-validation errors
                    toast.error(errorMessage, {
                        description: errorDescription,
                        duration: 5000,
                    });
                }
                setSubmitting(false);
            },
        });
    };

    const serviceTypes: Record<string, string> = {
        '1457567289': 'Fixed Broadband',
        '1207609454': 'Fixed Voice',
        '180427974': 'Combo Services',
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit}>
                <div className="mt-4">
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
                    <div className="flex flex-col gap-4 w-1/2   ">
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
                                    className={
                                        manualFlowErrors.phone
                                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                            : ''
                                    }
                                    disabled={submitting}
                                    required
                                />
                                {manualFlowErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {manualFlowErrors.phone}
                                    </p>
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
                                    className={
                                        manualFlowErrors.address
                                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                            : ''
                                    }
                                    disabled={submitting}
                                    required
                                />
                                {manualFlowErrors.address && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {manualFlowErrors.address}
                                    </p>
                                )}
                            </Field>
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
                        Back
                    </Button>
                    <Button type="submit" disabled={submitting || createSurveyMutation.isPending} className="bg-primary hover:bg-primary/90">
                        {(submitting || createSurveyMutation.isPending) ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting Request...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Submit
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

