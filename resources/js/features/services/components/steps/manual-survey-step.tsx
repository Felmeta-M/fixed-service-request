import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateSurvey } from '@/hooks/use-api-mutations';
import { useServiceFormStore } from '@/store';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    customer_sub_id?: string | number;
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
    deviceId?: string | null;
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
        area_code: string;
        area_name: string;
    };
    distance?: string;
    cable_type?: string;
    neid?: string;
    nename?: string;
    /** When true, show only bandwidth 7M + latitude/longitude (from require_manual_survey flow) */
    isMinimalManualSurvey?: boolean;
};

interface ManualSurveyStepProps {
    onBack: () => void;
}

export function ManualSurveyStep({ onBack }: ManualSurveyStepProps) {
    // ── Zustand store ─────────────────────────────────────────────────────
    const formData = useServiceFormStore((s) => s.formData);
    const updateFormData = useServiceFormStore((s) => s.updateFormData);
    const resetStore = useServiceFormStore((s) => s.reset);
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const [manualFlowData, setManualFlowData] = useState({
        name: (user as AuthUser)?.name || '',
        phone: (user as AuthUser)?.phone || '',
        email: (user as AuthUser)?.email || '',
    });

    const [manualFlowErrors, setManualFlowErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const submitGuardRef = useRef(false);

    const createSurveyMutation = useCreateSurvey();

    // Initialize form data from user if not provided
    useEffect(() => {
        if (user) {
            setManualFlowData({
                name: (user as AuthUser)?.name || '',
                phone: (user as AuthUser)?.phone || '',
                email: (user as AuthUser)?.email || '',
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
            contact_email: 'email',
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
            const errorMessage = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages;

            if (errorMessage) {
                formErrors[formField] = errorMessage;
            }
        });

        return formErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitGuardRef.current || createSurveyMutation.isPending) return;
        submitGuardRef.current = true;
        setManualFlowErrors({});
        setSubmitting(true);

        const isMinimal = formData.isMinimalManualSurvey === true;

        if (isMinimal) {
            if (!formData.serviceType || !formData.serviceType.trim()) {
                submitGuardRef.current = false;
                setSubmitting(false);
                setManualFlowErrors({ serviceType: 'Please select a service type' });
                return;
            }
            if (!manualFlowData.name?.trim()) {
                submitGuardRef.current = false;
                setSubmitting(false);
                setManualFlowErrors({ name: 'Contact name is required' });
                return;
            }
            const phoneError = validatePhoneNumber(manualFlowData.phone);
            if (phoneError) {
                submitGuardRef.current = false;
                setSubmitting(false);
                setManualFlowErrors({ phone: phoneError });
                return;
            }
            if (
                formData.latitude == null ||
                formData.longitude == null ||
                formData.latitude === 0 ||
                formData.longitude === 0
            ) {
                submitGuardRef.current = false;
                setSubmitting(false);
                toast.error('Location is required', {
                    description: 'Latitude and longitude from your selected location are needed.',
                });
                return;
            }

            const submitData = {
                main_offer_id: formData.serviceType,
                bandwidth: '7M',
                contact_person: manualFlowData.name.trim() || (user as AuthUser)?.name || '',
                contact_no: manualFlowData.phone.trim() || (user as AuthUser)?.phone || '',
                contact_email: manualFlowData.email.trim() || (user as AuthUser)?.email || '',
                survey_address_info: {
                    latitude: String(formData.latitude),
                    longitude: String(formData.longitude),
                },
                with_device: formData.withDevice,
                device_id: formData.deviceId || null,
                survey_is_manual: true,
            };

            const submissionToast = toast.loading('Creating your service request...', {
                description: 'Please wait while we process your manual request',
            });

            createSurveyMutation.mutate(submitData, {
                onSuccess: (response: any) => {
                    submitGuardRef.current = false;
                    setSubmitting(false);
                    const responseData = response.data;
                    const { customer_survey_order_id: surveyId } = responseData;
                    const serviceTypes: Record<string, string> = {
                        '1457567289': 'Fixed Broadband',
                        '1207609454': 'Fixed Voice',
                        '102647257': 'Combo Services',
                    };
                    const newSurvey = {
                        id: surveyId,
                        type: serviceTypes[formData.serviceType] || 'Service Request',
                        status: 'waiting',
                        createdAt: new Date().toISOString(),
                        main_offer_id: formData.serviceType,
                    };
                    const existingSurveys = JSON.parse(localStorage.getItem('userSurveys') || '[]');
                    existingSurveys.push(newSurvey);
                    localStorage.setItem('userSurveys', JSON.stringify(existingSurveys));
                    toast.success('Service request created successfully!', {
                        id: submissionToast,
                        description:
                            'Your manual request has been submitted. Our team will review your location and contact you within 1-2 business days.',
                        duration: 5000,
                    });
                    setTimeout(() => router.visit(route('services')), 1500);
                },
                onError: (error: Error) => {
                    submitGuardRef.current = false;
                    toast.dismiss(submissionToast);
                    const errorData = (error as any).data;
                    if (errorData?.errors) {
                        setManualFlowErrors(parseValidationErrors(errorData.errors));
                    } else {
                        toast.error(error.message || 'Failed to create your service request. Please try again.', {
                            duration: 5000,
                        });
                    }
                    setSubmitting(false);
                },
            });
            return;
        }

        // Full manual flow validation (bandwidth is fixed at 7M)
        if (!formData.serviceType || !formData.serviceType.trim()) {
            submitGuardRef.current = false;
            setManualFlowErrors({ serviceType: 'Please select a service type' });
            setSubmitting(false);
            return;
        }
        if (!manualFlowData.name?.trim()) {
            submitGuardRef.current = false;
            setManualFlowErrors({ name: 'Contact name is required' });
            setSubmitting(false);
            return;
        }

        const phoneError = validatePhoneNumber(manualFlowData.phone);
        if (phoneError) {
            submitGuardRef.current = false;
            setManualFlowErrors({ phone: phoneError });
            setSubmitting(false);
            return;
        }

        if (!formData.latitude || !formData.longitude || formData.latitude === 0 || formData.longitude === 0) {
            submitGuardRef.current = false;
            setSubmitting(false);
            toast.error('Please select a valid location on the map', {
                description: 'Please click on the map to select your installation location.',
            });
            return;
        }

        // Backend resolves telecom_region from lat/long via ethio_shops; bandwidth fixed at 7M for manual
        const submitData = {
            main_offer_id: formData.serviceType,
            bandwidth: '7M',
            contact_person: manualFlowData.name.trim() || (user as AuthUser)?.name || '',
            contact_no: manualFlowData.phone.trim() || (user as AuthUser)?.phone || '',
            contact_email: manualFlowData.email.trim() || (user as AuthUser)?.email || '',
            survey_address_info: {
                latitude: String(formData.latitude),
                longitude: String(formData.longitude),
            },
            with_device: formData.withDevice,
            device_id: formData.deviceId || null,
            survey_is_manual: true,
        };

    const submissionToast = toast.loading('Creating your service request...', {
            description: 'Please wait while we process your manual request',
        });

        createSurveyMutation.mutate(submitData, {
            onSuccess: (response) => {
                submitGuardRef.current = false;
                setSubmitting(false);
                const responseData = response.data;
                const { customer_survey_order_id: surveyId } = responseData;

                // Save to local storage
                const serviceTypes: Record<string, string> = {
                    '1457567289': 'Fixed Broadband',
                    '1207609454': 'Fixed Voice',
                    '102647257': 'Combo Services',
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
                    description:
                        'Your manual request has been submitted. Our team will review your location and contact you within 1-2 business days.',
                    duration: 5000,
                });

                // Clear all service-creation state before leaving
                resetStore();

                // Navigate to services page after a brief delay
                setTimeout(() => {
                    router.visit(route('services'));
                }, 1500);
            },
            onError: (error: Error) => {
                submitGuardRef.current = false;
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
                    errorDescription =
                        Object.keys(validationErrors).length > 0
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
        '102647257': 'Combo Services',
    };

    const isMinimal = formData.isMinimalManualSurvey === true;

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit}>
                <div className="mt-4">
                    <div>
                        <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Minimal manual flow: service type, bandwidth 7M, contact (lat/long sent in payload, hidden from UI) */}
                            {isMinimal ? (
                                <>
                                    <Field>
                                        <FieldLabel>Service Type</FieldLabel>
                                        <Input
                                            type="text"
                                            value={formData.serviceType ? (serviceTypes[formData.serviceType] ?? '') : ''}
                                            placeholder="Not selected"
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        {manualFlowErrors.serviceType && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {manualFlowErrors.serviceType}
                                            </p>
                                        )}
                                    </Field>
                                    {formData.serviceType !== '1207609454' && (
                                        <Field>
                                            <FieldLabel>Bandwidth</FieldLabel>
                                            <Input type="text" value="7 Mbps" disabled className="bg-gray-50" />
                                        </Field>
                                    )}
                                    <Field>
                                        <FieldLabel htmlFor="manual-name-min">Contact Name <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="manual-name-min"
                                            type="text"
                                            placeholder="Your name"
                                            value={manualFlowData.name}
                                            onChange={(e) => {
                                                setManualFlowData({ ...manualFlowData, name: e.target.value });
                                                if (manualFlowErrors.name) setManualFlowErrors({ ...manualFlowErrors, name: '' });
                                            }}
                                            className={manualFlowErrors.name ? 'border-red-500 bg-red-50' : ''}
                                            disabled={submitting}
                                        />
                                        {manualFlowErrors.name && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {manualFlowErrors.name}
                                            </p>
                                        )}
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="manual-phone-min">Contact Phone <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="manual-phone-min"
                                            type="tel"
                                            placeholder="+251 9XX XXX XXX"
                                            value={manualFlowData.phone}
                                            onChange={(e) => {
                                                setManualFlowData({ ...manualFlowData, phone: e.target.value });
                                                if (manualFlowErrors.phone) setManualFlowErrors({ ...manualFlowErrors, phone: '' });
                                            }}
                                            className={manualFlowErrors.phone ? 'border-red-500 bg-red-50' : ''}
                                            disabled={submitting}
                                        />
                                        {manualFlowErrors.phone && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {manualFlowErrors.phone}
                                            </p>
                                        )}
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="manual-email-min">Contact Email</FieldLabel>
                                        <Input
                                            id="manual-email-min"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={manualFlowData.email}
                                            onChange={(e) => setManualFlowData({ ...manualFlowData, email: e.target.value })}
                                            disabled={submitting}
                                        />
                                    </Field>
                                </>
                            ) : (
                                <>
                                    {formData.serviceType && (
                                        <Field>
                                            <FieldLabel>Service Type</FieldLabel>
                                            <Input type="text" value={serviceTypes[formData.serviceType] || 'Unknown'} disabled className="bg-gray-50" />
                                        </Field>
                                    )}

                                    {formData.serviceType !== '1207609454' && (
                                        <Field>
                                            <FieldLabel>Bandwidth</FieldLabel>
                                            <Input type="text" value="7 Mbps" disabled className="bg-gray-50" />
                                        </Field>
                                    )}

                                    <Field>
                                        <FieldLabel htmlFor="manual-name">Contact Name <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="manual-name"
                                            type="text"
                                            placeholder="Your name"
                                            value={manualFlowData.name}
                                            onChange={(e) => {
                                                setManualFlowData({ ...manualFlowData, name: e.target.value });
                                                if (manualFlowErrors.name) setManualFlowErrors({ ...manualFlowErrors, name: '' });
                                            }}
                                            className={manualFlowErrors.name ? 'border-red-500 bg-red-50' : ''}
                                            disabled={submitting}
                                        />
                                        {manualFlowErrors.name && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {manualFlowErrors.name}
                                            </p>
                                        )}
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="manual-phone">
                                            Contact Phone <span className="text-red-500">*</span>
                                        </FieldLabel>
                                        <Input
                                            id="manual-phone"
                                            type="tel"
                                            placeholder="+251 9XX XXX XXX"
                                            value={manualFlowData.phone}
                                            onChange={(e) => {
                                                setManualFlowData({ ...manualFlowData, phone: e.target.value });
                                                if (manualFlowErrors.phone) setManualFlowErrors({ ...manualFlowErrors, phone: '' });
                                            }}
                                            className={manualFlowErrors.phone ? 'border-red-500 bg-red-50' : ''}
                                            disabled={submitting}
                                            required
                                        />
                                        {manualFlowErrors.phone && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {manualFlowErrors.phone}
                                            </p>
                                        )}
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="manual-email">Contact Email</FieldLabel>
                                        <Input
                                            id="manual-email"
                                            type="email"
                                            placeholder=""
                                            value={manualFlowData.email}
                                            onChange={(e) => setManualFlowData({ ...manualFlowData, email: e.target.value })}
                                            disabled={submitting}
                                        />
                                    </Field>
                                </>
                            )}
                        </FieldGroup>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2 flex justify-between pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={submitting}
                        className="flex items-center space-x-2 text-[#068BCC]"
                    >
                        <ArrowLeft className="h-4 w-4 text-[#068BCC]" />
                        <span>Back</span>
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || createSurveyMutation.isPending}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                    >
                        {submitting || createSurveyMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Submitting Request...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                <span>Submit Manual Request</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
