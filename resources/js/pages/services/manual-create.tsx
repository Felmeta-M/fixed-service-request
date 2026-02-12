import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/main-layout';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCreateSurvey } from '@/hooks/use-api-mutations';
import { toast } from 'sonner';

interface AuthUser {
    id?: number;
    customer_code?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    api_token?: string;
}

interface ManualCreatePageProps {
    googleMapsApiKey: string;
    formData?: {
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
}

export default function ManualCreatePage({ googleMapsApiKey, formData: initialFormData }: ManualCreatePageProps) {
    const { user } = usePage<{ auth: { user: AuthUser } }>().props.auth;

    const [formData, setFormData] = useState({
        serviceType: initialFormData?.serviceType || '1457567289',
        bandwidth: initialFormData?.bandwidth || '',
        customerType: initialFormData?.customerType || 'residential',
        withDevice: initialFormData?.withDevice,
        latitude: initialFormData?.latitude || 0,
        longitude: initialFormData?.longitude || 0,
        address: initialFormData?.address || '',
        contactPerson: initialFormData?.contactPerson || (user as AuthUser)?.name || '',
        contactNo: initialFormData?.contactNo || (user as AuthUser)?.phone || '',
        contactEmail: initialFormData?.contactEmail || (user as AuthUser)?.email || '',
        resourceData: initialFormData?.resourceData,
        distance: initialFormData?.distance || '',
        cable_type: initialFormData?.cable_type || '',
        neid: initialFormData?.neid || '',
        nename: initialFormData?.nename || '',
    });

    const [manualFlowData, setManualFlowData] = useState({
        phone: (user as AuthUser)?.phone || '',
        name: (user as AuthUser)?.name || '',
    });

    const [manualFlowErrors, setManualFlowErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const submitGuardRef = useRef(false);
    const createSurveyMutation = useCreateSurvey();

    // Initialize form data from user if not provided
    useEffect(() => {
        if (user) {
            setManualFlowData({
                phone: (user as AuthUser)?.phone || '',
                name: (user as AuthUser)?.name || '',
            });
            setFormData((prev) => ({
                ...prev,
                contactPerson: prev.contactPerson || (user as AuthUser)?.name || '',
                contactNo: prev.contactNo || (user as AuthUser)?.phone || '',
                contactEmail: prev.contactEmail || (user as AuthUser)?.email || '',
            }));
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
        if (submitGuardRef.current || createSurveyMutation.isPending) return;
        submitGuardRef.current = true;
        setManualFlowErrors({});
        setSubmitting(true);

        // Validate phone number
        const phoneError = validatePhoneNumber(manualFlowData.phone);
        if (phoneError) {
            submitGuardRef.current = false;
            setManualFlowErrors({ phone: phoneError });
            setSubmitting(false);
            return;
        }

        // Validate address
        if (!formData.address || !formData.address.trim()) {
            submitGuardRef.current = false;
            setManualFlowErrors({ address: 'Location address is required' });
            setSubmitting(false);
            return;
        }

        // Validate location coordinates
        if (!formData.latitude || !formData.longitude || formData.latitude === 0 || formData.longitude === 0) {
            submitGuardRef.current = false;
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
                address: formData.address || '',
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
                    description: 'Your manual request has been submitted. Our team will review your location and contact you within 1-2 business days.',
                    duration: 5000,
                });

                // Navigate to services page after a brief delay
                setTimeout(() => {
                    router.visit(route('services'));
                }, 1500);
            },
            onError: (error: Error) => {
                submitGuardRef.current = false;
                toast.dismiss(submissionToast);
                const errorMessage = error.message || 'Failed to create your service request. Please try again.';
                toast.error(errorMessage, {
                    description: 'An unexpected error occurred. Please try again.',
                    duration: 5000,
                });
                setSubmitting(false);
            },
        });
    };

    const serviceTypes: Record<string, string> = {
        '1457567289': 'Fixed Broadband',
        '1207609454': 'Fixed Voice',
        '102647257': 'Combo Services',
    };

    return (
        <MainLayout>
            <div className="w-full mx-auto max-w-6xl space-y-6 px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.visit(route('services.create'))}
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Submit Manual Request</h1>
                        <p className="text-sm text-gray-500">Complete your service request manually</p>
                    </div>
                </div>

                {/* Info Card */}
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-amber-900 mb-2">Location Review Needed</h3>
                                <p className="text-sm text-amber-800">
                                    We're currently unable to automatically provision service for this location because
                                    available resources could not be confirmed. Our team will review your location,
                                    conduct a site assessment if needed, and contact you to assist with the next steps.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Please provide your contact details for our team to reach you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Location Information</CardTitle>
                            <CardDescription>Your selected location details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="manual-address">
                                        Address <span className="text-red-500">*</span>
                                    </FieldLabel>
                                    <Textarea
                                        id="manual-address"
                                        rows={3}
                                        placeholder="Enter your specific location address"
                                        value={formData.address || ''}
                                        onChange={(e) => {
                                            setFormData({ ...formData, address: e.target.value });
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
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
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
                                </div>

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
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('services.create'))}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || createSurveyMutation.isPending} className="bg-primary hover:bg-primary/90">
                            {(submitting || createSurveyMutation.isPending) ? (
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
        </MainLayout>
    );
}

