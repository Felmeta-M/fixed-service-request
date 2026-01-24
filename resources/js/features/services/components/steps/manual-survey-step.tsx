import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { useCreateSurvey, useGetCustomer } from '@/hooks/use-api-mutations';
import { useRegions, useWoredas, useZones, useTelecomRegionsByZone } from '@/hooks/use-regions';
import { formatBandwidthLabel } from '@/hooks/use-bandwidth-options';

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

    // Address selection state
    const [selectedAddress, setSelectedAddress] = useState({
        region: '',
        zone: '',
        woreda: '',
        kebele: '',
    });

    // Telecom region selection state (for service installation area)
    const [selectedTelecomRegion, setSelectedTelecomRegion] = useState('');

    const createSurveyMutation = useCreateSurvey();

    // Fetch customer data to get address information for fallback
    const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomer(
        (user as AuthUser)?.customer_sub_id
    );

    // Address dropdown hooks
    const { regions: regionOptions, loading: loadingRegions } = useRegions();
    const { zones: zoneOptions, loading: loadingZones } = useZones(selectedAddress.region);
    const { woredas: woredaOptions, loading: loadingWoredas } = useWoredas(selectedAddress.zone);

    // Telecom regions based on selected zone (for service installation area)
    const { telecomRegions: telecomRegionOptions, loading: loadingTelecomRegions } = useTelecomRegionsByZone(selectedAddress.zone);

    // Check if kebele is required based on region (not required for Addis Ababa)
    const isKebeleRequired = useMemo(() => {
        if (!selectedAddress.region) return false;

        // Find the region name from the region options
        const selectedRegion = regionOptions.find((r) => r.value === selectedAddress.region);
        const regionName = selectedRegion?.label?.toLowerCase() || '';

        // Addis Ababa region names (case-insensitive check)
        const addisAbabaNames = ['addis ababa', 'addisababa', 'addis_ababa'];
        const isAddisAbaba = addisAbabaNames.some((name) => regionName.includes(name));

        return !isAddisAbaba; // Required for all regions except Addis Ababa
    }, [selectedAddress.region, regionOptions]);

    // Initialize address from customer data if available
    useEffect(() => {
        if (customerData && !selectedAddress.region) {
            const customer = customerData?.data || customerData;
            if (customer) {
                const customerRegion = customer.region || customer.address?.region || '';
                const customerZone = customer.zone || customer.address?.zone || '';
                const customerWoreda = customer.woreda || customer.address?.woreda || '';
                const customerKebele = customer.kebele || customer.address?.kebele || '';

                if (customerRegion || customerZone || customerWoreda || customerKebele) {
                    setSelectedAddress({
                        region: customerRegion,
                        zone: customerZone,
                        woreda: customerWoreda,
                        kebele: customerKebele,
                    });
                }
            }
        }
    }, [customerData]);

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
            setSubmitting(false);
            toast.error('Location address is required', {
                description: 'Please enter a valid address for the service installation location.',
            });
            return;
        }

        // Validate location coordinates
        if (!formData.latitude || !formData.longitude || formData.latitude === 0 || formData.longitude === 0) {
            setSubmitting(false);
            toast.error('Please select a valid location on the map', {
                description: 'Please click on the map to select your installation location.',
            });
            return;
        }

        // Validate telecom zone selection (mandatory)
        if (!selectedTelecomRegion) {
            setSubmitting(false);
            setManualFlowErrors({ telecom_region: 'Please select a telecom zone' });
            toast.error('Nearest ethiotelecom zone is required', {
                description: 'Please select the nearest ethiotelecom zone for your service installation.',
            });
            return;
        }

        // Build survey creation payload for manual survey
        // Manual surveys don't require encrypted resource fields - they use different backend service
        const encryptedResource = formData.resourceData;

        // Get customer address data for fallback
        const customer = customerData?.data || customerData;
        const customerRegion = customer?.region || customer?.address?.region || '';
        const customerZone = customer?.zone || customer?.address?.zone || '';
        const customerWoreda = customer?.woreda || customer?.address?.woreda || '';
        const customerKebele = customer?.kebele || customer?.address?.kebele || '';

        // Use selected address if available, otherwise fallback to customer address
        const finalRegion = selectedAddress.region || customerRegion || '2';
        const finalZone = selectedAddress.zone || customerZone || '11';
        const finalWoreda = selectedAddress.woreda || customerWoreda || '141';
        const finalKebele = selectedAddress.kebele || customerKebele || '';

        const submitData = {
            customer_code: (user as AuthUser)?.customer_code?.toString() || '',
            customer_type: formData.customerType || 'residential',
            survey_type: 'EIC08',
            telecom_region: selectedTelecomRegion || '104', // Use selected telecom region or fallback
            oper_type: 'A',
            main_offer_id: formData.serviceType,
            bandwidth: formData.bandwidth,
            contact_person: manualFlowData.name.trim() || formData.contactPerson || (user as AuthUser)?.name || 'Customer',
            contact_no: manualFlowData.phone.trim() || formData.contactNo || (user as AuthUser)?.phone || '',
            contact_email: formData.contactEmail || (user as AuthUser)?.email || '',
            survey_address_info: {
                // Use selected address or fallback to customer address
                region_city: finalRegion,
                subcity_zone: finalZone,
                wereda_town: finalWoreda,
                kebele: finalKebele,
                address: address.trim(), // Use edited address
                // Manual surveys: use encrypted resource fields if available, otherwise use form data or empty strings
                latitude: encryptedResource?.latitude ?? String(formData.latitude),
                longitude: encryptedResource?.longitude ?? String(formData.longitude),
                distance: encryptedResource?.distance ?? formData.distance ?? '',
                cable_type: encryptedResource?.cable_type ?? formData.cable_type ?? '',
                neid: encryptedResource?.neid ?? '',
                nename: encryptedResource?.nename ?? '',
                area_code: encryptedResource?.area_code ?? '',
                area_name: encryptedResource?.area_name ?? '',
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
                                        value={formData.bandwidth ? formatBandwidthLabel(formData.bandwidth) : ''}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </Field>
                            )}

                            {/* <Field>
                                <FieldLabel>Customer Type</FieldLabel>
                                <Input
                                    type="text"
                                    value={formData.customerType ? formData.customerType.charAt(0).toUpperCase() + formData.customerType.slice(1) : 'Residential'}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </Field> */}

                            {/* <Field>
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
                            </Field> */}
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
                        </FieldGroup>
                    </div>
                </div>

                <div className="mt-2">
                    {/* <div>
                        <div className="font-semibold text-lg">Location Information</div>
                        <div className="text-sm text-gray-500">Your selected location details - you can edit the address to be more specific</div>
                    </div> */}
                    <div className="flex flex-col gap-4 w-1/2   ">
                        {/* <Field>
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
                        </Field> */}


                        {/* <Field>
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
                        </Field> */}
                    </div>
                </div>

                {/* Address Selection Dropdowns */}
                <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-start gap-4">
                        <div className="hidden rounded-full bg-primary/10 p-2 sm:block">
                            <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Installation Address</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Please provide the exact location where you would like the service to be installed. This helps us check availability and plan the connection.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="manual-region" className="text-gray-700">
                                Region {selectedAddress.region ? '' : <span className="ml-1 text-red-500">*</span>}
                            </FieldLabel>
                            <Select
                                value={selectedAddress.region}
                                onValueChange={(value) => {
                                    setSelectedAddress({
                                        region: value,
                                        zone: '',
                                        woreda: '',
                                        kebele: '',
                                    });
                                    if (manualFlowErrors.region) {
                                        setManualFlowErrors({ ...manualFlowErrors, region: '' });
                                    }
                                }}
                                disabled={submitting || loadingRegions}
                            >
                                <SelectTrigger
                                    className={
                                        manualFlowErrors.region
                                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                            : 'bg-gray-50/50'
                                    }
                                >
                                    <SelectValue placeholder={loadingRegions ? 'Loading regions...' : 'Select region'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {regionOptions.map((region) => (
                                        <SelectItem key={region.value} value={region.value}>
                                            {region.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {manualFlowErrors.region && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {manualFlowErrors.region}
                                </p>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="manual-zone" className="text-gray-700">
                                Zone {selectedAddress.zone ? '' : <span className="ml-1 text-red-500">*</span>}
                            </FieldLabel>
                            <Select
                                value={selectedAddress.zone}
                                onValueChange={(value) => {
                                    setSelectedAddress({
                                        ...selectedAddress,
                                        zone: value,
                                        woreda: '',
                                        kebele: '',
                                    });
                                    // Reset telecom region when zone changes
                                    setSelectedTelecomRegion('');
                                    if (manualFlowErrors.zone) {
                                        setManualFlowErrors({ ...manualFlowErrors, zone: '' });
                                    }
                                }}
                                disabled={submitting || loadingZones || !selectedAddress.region}
                            >
                                <SelectTrigger
                                    className={
                                        manualFlowErrors.zone
                                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                            : 'bg-gray-50/50'
                                    }
                                >
                                    <SelectValue
                                        placeholder={
                                            !selectedAddress.region
                                                ? 'First select region'
                                                : loadingZones
                                                    ? 'Loading zones...'
                                                    : 'Select zone'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {zoneOptions.map((zone) => (
                                        <SelectItem key={zone.value} value={zone.value}>
                                            {zone.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {manualFlowErrors.zone && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {manualFlowErrors.zone}
                                </p>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="manual-woreda" className="text-gray-700">
                                Woreda {selectedAddress.woreda ? '' : <span className="ml-1 text-red-500">*</span>}
                            </FieldLabel>
                            <Select
                                value={selectedAddress.woreda}
                                onValueChange={(value) => {
                                    setSelectedAddress({
                                        ...selectedAddress,
                                        woreda: value,
                                    });
                                    if (manualFlowErrors.woreda) {
                                        setManualFlowErrors({ ...manualFlowErrors, woreda: '' });
                                    }
                                }}
                                disabled={submitting || loadingWoredas || !selectedAddress.zone}
                            >
                                <SelectTrigger
                                    className={
                                        manualFlowErrors.woreda
                                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                            : 'bg-gray-50/50'
                                    }
                                >
                                    <SelectValue
                                        placeholder={
                                            !selectedAddress.zone
                                                ? 'First select zone'
                                                : loadingWoredas
                                                    ? 'Loading woredas...'
                                                    : 'Select woreda'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {woredaOptions.map((woreda) => (
                                        <SelectItem key={woreda.value} value={woreda.value}>
                                            {woreda.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {manualFlowErrors.woreda && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {manualFlowErrors.woreda}
                                </p>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="manual-kebele" className="text-gray-700">
                                Kebele {isKebeleRequired && !selectedAddress.kebele ? <span className="ml-1 text-red-500">*</span> : ''}
                            </FieldLabel>
                            <Input
                                id="manual-kebele"
                                type="text"
                                placeholder="Enter kebele name/number"
                                value={selectedAddress.kebele}
                                onChange={(e) => {
                                    setSelectedAddress({
                                        ...selectedAddress,
                                        kebele: e.target.value,
                                    });
                                    if (manualFlowErrors.kebele) {
                                        setManualFlowErrors({ ...manualFlowErrors, kebele: '' });
                                    }
                                }}
                                className={
                                    manualFlowErrors.kebele
                                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                        : 'bg-gray-50/50'
                                }
                                disabled={submitting}
                                required={isKebeleRequired}
                            />
                            {manualFlowErrors.kebele && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {manualFlowErrors.kebele}
                                </p>
                            )}
                        </Field>

                        {/* Nearest Telecom Zone - Mandatory */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="rounded-lg bg-blue-50/50 p-4 border border-blue-100/50">
                                <Field>
                                    <FieldLabel htmlFor="manual-telecom-zone" className="text-gray-700 flex items-center gap-2">
                                        Nearest Telecom Zone {selectedTelecomRegion ? '' : <span className="text-red-500">*</span>}
                                        <span className="text-xs font-normal text-gray-500">(Required for technical assignment)</span>
                                    </FieldLabel>
                                    <Select
                                        value={selectedTelecomRegion}
                                        onValueChange={(value) => {
                                            setSelectedTelecomRegion(value);
                                            if (manualFlowErrors.telecom_region) {
                                                setManualFlowErrors({ ...manualFlowErrors, telecom_region: '' });
                                            }
                                        }}
                                        disabled={submitting || loadingTelecomRegions || !selectedAddress.zone}
                                    >
                                        <SelectTrigger
                                            className={
                                                manualFlowErrors.telecom_region
                                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                                    : 'bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-100'
                                            }
                                        >
                                            <SelectValue
                                                placeholder={
                                                    !selectedAddress.zone
                                                        ? 'First select zone to see nearby telecom zones'
                                                        : loadingTelecomRegions
                                                            ? 'Searching for nearby zones...'
                                                            : telecomRegionOptions.length === 0
                                                                ? 'No telecom zones found in this area'
                                                                : 'Select the nearest telecom zone'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {telecomRegionOptions.map((region) => (
                                                <SelectItem key={region.value} value={region.value}>
                                                    {region.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {manualFlowErrors.telecom_region && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {manualFlowErrors.telecom_region}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        Select the telecom office or zone closest to your installation address.
                                    </p>
                                </Field>
                            </div>
                        </div>
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

