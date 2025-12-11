import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerCategories, useCustomerSubcategories, useCustomerTypes } from '@/hooks/use-customer-types';
import { useOccupations } from '@/hooks/use-occupations';
import { useRegions, useWoredas, useZones } from '@/hooks/use-regions';
import AuthLayout from '@/layouts/AuthLayout';
import GuestLayout from '@/layouts/GuestLayout';
import { CustomerFormValues, customerSchema } from '@/types/customer';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Building, CheckCircle, FileIcon, FileText, MapPin, MapPinIcon, Phone, PhoneIcon, User, UserIcon } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormSelectProps } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function FormSelect({
    label,
    id,
    required,
    value,
    onChange,
    options,
    placeholder,
    error,
    disabled,
    loading,
    labelRight,
}: FormSelectProps & { required?: boolean }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
                {required && <span className=" text-red-500">*</span>}
                {labelRight && <div className="inline-block">{labelRight}</div>}
            </Label>

            <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
                <SelectTrigger className={`${error ? 'border-red-300' : 'border-gray-300'} flex items-center justify-between`}>
                    {loading ? (
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                    ) : (
                        <SelectValue placeholder={placeholder} />
                    )}
                </SelectTrigger>

                {!loading && (
                    <SelectContent className="bg-white shadow-lg">
                        {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                )}
            </Select>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

export interface FormInputProps {
    label: string;
    id: string;
    value?: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    type?: React.HTMLInputTypeAttribute;
    required?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
}

export function FormInput({
    label,
    id,
    value,
    onChange,
    placeholder = "",
    error,
    type = "text",
    required = false,
    readOnly = false,
    disabled = false,
}: FormInputProps) {
    const safeValue = value ?? "";
    console.log({
        label,
        id,
        value,
        onChange,
        placeholder,
        error,
        type,
        required,
        readOnly,
        disabled,
    })
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>
            <input
                type={type}
                className={
                    cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        , `${error
                            ? "border-red-300 focus:ring-red-200"
                            : "border-gray-300 focus:ring-green-200"
                        } focus:ring-2 focus:outline-none`)}
                id={id}
                value={safeValue}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={disabled}
            // className={`${error
            //     ? "border-red-300 focus:ring-red-200"
            //     : "border-gray-300 focus:ring-green-200"
            //     } focus:ring-2 focus:outline-none`}
            />

            {/*        {error && <p className="text-sm text-red-500">{error}</p>} */}
        </div>
    );
}





export default function Create() {
    const { auth } = usePage().props;
    const { user } = auth;

    const { occupations, loading, error: occupationError } = useOccupations();
    const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [customerCreated, setCustomerCreated] = useState(false);
    const [createdCustomerData, setCreatedCustomerData] = useState<any>(null);


    const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());
    const [isLoadingPrefill, setIsLoadingPrefill] = useState(true);

    const { data, setData, processing } = useForm<CustomerFormValues>('createCustomer', {
        first_name: '',
        middle_name: '',
        last_name: '',
        title: '1',
        gender: undefined,
        nationality: '1231',
        identification_type: '2',
        identification_number: '',
        date_of_birth: '',
        place_of_birth: '',
        occupation: undefined,
        education: undefined,
        religion: undefined,
        income: undefined,
        primary_language: '2060',
        address: {
            region: '',
            zone: '',
            woreda: '',
            city: '',
            street_name: '',
            kebele: '',
            house_no: '',
        },
        contact: {
            notification_mode: '1',
            mobile_no: '',
            office_no: '',
            email: '',
            home_no: '',
            fax_no: '',
        },
        contact_person: [],
        customer_type: '1',
        customer_category: '1',
        customer_subcategory: '1',
        customer_level: '2',
    });

    const API_READONLY_FIELDS = [
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        // 'place_of_birth',
        // 'identification_number',
        'nationality',
        'identification_type',
        'contact.notification_mode',
        'contact.mobile_no',
    ];

    useEffect(() => {
        const loadDataFromApi = async () => {
            try {
                setIsLoadingPrefill(true);

                // Only load data if user has customer_sub_id
                if (user?.customer_sub_id) {
                    console.log('Loading customer data from API for customer_sub_id:', user?.customer_sub_id);

                    const response = await axios.get('/api/v1/customer', {
                        params: { customer_sub_id: user?.customer_sub_id },
                        headers: {
                            Authorization: `Bearer ${user?.api_token}`,
                        },
                    });

                    if (response.data?.success && response.data?.data) {
                        const customer = response.data.data;
                        console.log('Customer data loaded from API:', customer);

                        // Set read-only fields
                        setReadOnlyFields(new Set(API_READONLY_FIELDS));

                        // Transform API data to match form structure
                        const transform = {
                            first_name: customer.first_name || '',
                            middle_name: customer.middle_name || '',
                            last_name: customer.last_name || '',
                            title: customer.title || '1',
                            gender: customer.gender?.toLowerCase() === 'male' ? '1' : customer.gender?.toLowerCase() === 'female' ? '2' : undefined,
                            nationality: customer.nationality?.toLowerCase() === 'ethiopian' ? '1231' : '1000',
                            date_of_birth: customer.date_of_birth || '',
                            place_of_birth: customer.place_of_birth || '',
                            identification_type: customer.identification_type || '2',
                            identification_number: customer.identification_number || '',
                            occupation: customer.occupation || '',
                            education: customer.education || '',
                            religion: customer.religion || '',
                            income: customer.income || '',
                            primary_language: customer.primary_language || '2060',
                            customer_type: customer.customer_type || '1',
                            customer_category: customer.customer_category || '1',
                            customer_subcategory: customer.customer_subcategory || '1',
                            contact: {
                                notification_mode: customer.contact?.notification_mode || customer.notification_mode || '1',
                                mobile_no: customer.contact?.mobile_no || customer.mobile_no || '',
                                office_no: customer.contact?.office_no || customer.office_no || '',
                                email: customer.contact?.email || customer.email || '',
                                home_no: customer.contact?.home_no || customer.home_no || '',
                                fax_no: customer.contact?.fax_no || customer.fax_no || '',
                            },
                            address: {
                                region: customer.address?.region || customer.region || '',
                                zone: customer.address?.zone || customer.zone || '',
                                woreda: customer.address?.woreda || customer.woreda || '',
                                city: customer.address?.city || customer.city || '',
                                street_name: customer.address?.street_name || customer.street_name || '',
                                kebele: customer.address?.kebele || customer.kebele || '',
                                house_no: customer.address?.house_no || customer.house_no || '',
                            },
                            contact_person: customer.contact_person || [],
                            customer_level: customer.customer_level || '2',
                        };

                        // Set all data at once
                        setData(transform);

                        // Handle photo
                        if (customer.photo_base64) {
                            localStorage.setItem('customer_photo_base64', customer.photo_base64);
                        }

                        console.log('Form initialized with API data');
                    } else {
                        console.log('No customer data found from API');
                    }
                } else {
                    console.log('No customer_sub_id found, starting with empty form');
                }
            } catch (error) {
                console.error('Error loading data from API:', error);
                toast.error('Failed to load existing customer data');
            } finally {
                setIsLoadingPrefill(false);
            }
        };

        loadDataFromApi();
    }, [user?.customer_sub_id, user?.api_token, setData]);

    // Set default customer category when customer_type is residential
    useEffect(() => {
        if (data.customer_type === '1' && !data.customer_category) {
            setData('customer_category', '1');
        }
    }, [data.customer_type, data.customer_category, setData]);

    // Set default customer subcategory when customer_category is residential
    useEffect(() => {
        if (data.customer_category === '1' && !data.customer_subcategory) {
            setData('customer_subcategory', '1');
        }
    }, [data.customer_category, data.customer_subcategory, setData]);

    const { types, loading: typesLoading, error: typesError } = useCustomerTypes();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCustomerCategories(data.customer_type);
    const { subcategories, loading: subcategoriesLoading, error: subcategoriesError } = useCustomerSubcategories(data.customer_category);

    const { regions: regionOptions, loading: loadingRegions } = useRegions();
    const { zones: zoneOptions, loading: loadingZones } = useZones(data.address?.region);
    const { woredas: woredaOptions, loading: loadingWoredas } = useWoredas(data.address?.zone);

    // Contact person state - only one contact person
    const [contactPerson, setContactPerson] = useState(
        data.contact_person && data.contact_person.length > 0
            ? data.contact_person[0] // Take the first contact person if exists
            : {
                first_name: '',
                middle_name: '',
                last_name: '',
                title: undefined,
                mobile_no: '',
                office_no: '',
                home_no: '',
                fax_no: '',
            },
    );

    // Update contact person
    const updateContactPerson = (field: string, val: string) => setContactPerson((prev) => ({ ...prev, [field]: val }));

    // Sync contact person with form data
    useEffect(() => {
        setData('contact_person', [contactPerson]); // Wrap in array for API
    }, [contactPerson, setData]);

    // Check if a field is read-only
    const isFieldReadOnly = (fieldName: string): boolean => {
        return readOnlyFields.has(fieldName);
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setFormErrors({});

        const result = customerSchema.safeParse(data);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
                if (val && val.length > 0) fieldErrors[key] = val[0];
            }
            setFormErrors(fieldErrors);
            return;
        }

        try {
            // --- STEP 1: CREATE CUSTOMER ---
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/customer/create`,
                {
                    ...result.data,
                    date_of_birth: result.data.date_of_birth ? result.data.date_of_birth.replace(/-/g, '') : null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user?.api_token}`,
                    },
                },
            );

            if (!response.data.success) {
                toast.error('Customer creation failed');
                return;
            }

            const customer = response.data.data?.original?.data || response.data.data;
            setCreatedCustomerData(customer);
            setCustomerCreated(true);

            // --- STEP 2: GET TRANSACTION ID ---
            const transactionId = customer.transaction_id || `txn_${Date.now()}`;

            // --- STEP 3: GET PHOTO FROM LOCAL STORAGE ---
            const base64Photo = localStorage.getItem('customer_photo_base64') || null;

            if (base64Photo) {
                toast.info('Uploading customer photo...', {
                    position: 'top-right',
                    className: 'bg-blue-50 text-blue-800 border-blue-100',
                });

                const uploadResult = await uploadPhotoToEcaf(customer, transactionId, base64Photo);

                if (uploadResult.success) {
                    toast.success('Customer created and photo uploaded successfully!', {
                        position: 'top-right',
                        className: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                    });
                } else {
                    toast.warning(`Customer created but photo upload failed: ${uploadResult.message}`, {
                        position: 'top-right',
                        className: 'bg-yellow-50 text-yellow-800 border-yellow-100',
                    });
                }
            } else {
                toast.success('Customer created successfully!', {
                    position: 'top-right',
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                });
            }

            // --- STEP 4: CLEANUP AND REDIRECT ---
            sessionStorage.removeItem('pending_customer_id');
            localStorage.removeItem('customer_photo_base64');

            setTimeout(() => {
                router.get(route('services'));
            }, 2000);
        } catch (error) {
            toast.error('An unexpected error occurred');
            console.error(error);
        }
    };

    const uploadPhotoToEcaf = async (customerData: any, transactionId: string, photoBase64: string) => {
        try {
            setUploadingPhoto(true);

            const ecafData = {
                cust_code: customerData.customer_code || customerData.customer_id,
                first_name: data.first_name,
                last_name: data.last_name,
                other_name: data.middle_name || '',
                transaction_id: transactionId,
                photo: photoBase64,
            };

            const response = await axios.post('/api/v1/ecaf-upload', ecafData, {
                headers: {
                    Authorization: `Bearer ${user.api_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data?.status === 'success' || response.data?.success) {
                return { success: true, data: response.data };
            }

            return { success: false, message: response.data?.message || 'ECAF upload failed' };
        } catch (error: any) {
            console.error('ECAF upload error:', error);
            return { success: false, message: error?.message || 'Upload failed' };
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Enhanced change handlers that prevent editing of read-only fields
    const handleInputChange = (field: string, value: string) => {
        if (isFieldReadOnly(field)) {
            toast.warning('This field is pre-filled from existing data and cannot be edited.');
            return;
        }

        setData(field, value);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const handleNestedInputChange = (parent: string, field: string, value: string) => {
        const fullFieldName = `${parent}.${field}`;
        if (isFieldReadOnly(fullFieldName)) {
            toast.warning('This field is pre-filled from existing data and cannot be edited.');
            return;
        }

        setData(parent, {
            ...data[parent],
            [field]: value,
        });

        const errorKey = `${parent}.${field}`;
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
        });
    };

    const handleSelectChange = (field: string, value: string) => {
        if (isFieldReadOnly(field)) {
            toast.warning('This field is pre-filled from existing data and cannot be edited.');
            return;
        }

        setData(field, value);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const clearFieldError = (fieldPath: string) => {
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldPath];
            return newErrors;
        });
    };

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const renderStepIndicator = () => (
        <div className="mb-6 flex items-center justify-center space-x-0">
            {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all sm:h-10 sm:w-10 ${step >= stepNumber ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'
                            } ${step === stepNumber ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                        {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                    </div>
                    {stepNumber < 4 && <div className={`h-0.5 w-16 transition-all ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`} />}
                </div>
            ))}
        </div>
    );

    // Show loading state when loading prefill data
    if (isLoadingPrefill) {
        return (
            <AuthLayout>
                <Head title="Create Customer" />
                <div className="flex min-h-screen items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                            {/* <h2 className="text-xl font-semibold">Loading Customer Data</h2> */}
                            <p className="text-gray-600">Please wait while we load your existing information...</p>
                        </CardContent>
                    </Card>
                </div>
            </AuthLayout>
        );
    }

    // Show loading state when uploading photo
    if (uploadingPhoto) {
        return (
            <GuestLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                            <h2 className="text-xl font-semibold">Uploading Customer Photo</h2>
                            <p className="text-gray-600">Please wait while we upload the photo...</p>
                        </CardContent>
                    </Card>
                </div>
            </GuestLayout>
        );
    }

    // Check if we have any pre-filled data
    const hasPrefilledData = readOnlyFields.size > 0;

    return (
        <AuthLayout>
            <Head title="Create Customer" />

            {Object.keys(formErrors).length > 0 && (
                <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <h3 className="font-medium text-red-800">Validation Errors</h3>
                        <pre className="text-sm text-red-600">{JSON.stringify(formErrors, null, 2)}</pre>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-4xl space-y-6 px-4 pb-10 sm:px-6">
                <div className="rounded-b-lg p-4 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Customer</h1>
                    <p className="text-md mt-1 text-gray-600">Fill in the customer details step by step</p>
                    {!hasPrefilledData && <p className="mt-2 text-sm text-gray-500">Starting with a new customer record.</p>}
                </div>

                {renderStepIndicator()}

                {step === 1 && (
                    <Card className="">
                        <CardHeader className="">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl">Personal Information</h2>
                                    <CardDescription className="text-gray-500">
                                        {hasPrefilledData ? 'Identity details and additional information' : 'Basic personal details of the customer'}
                                    </CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">

                                    <FormSelect
                                        label="Customer Type"
                                        required
                                        id="customer_type"
                                        value={data.customer_type}
                                        onChange={(val) => {
                                            setData('customer_type', val);
                                            if (val === '1') {
                                                setData('customer_category', '1');
                                                setData('customer_subcategory', '1');
                                            }
                                            if (val === '2') {
                                                setData('customer_category', '');
                                                setData('customer_subcategory', '');
                                            }
                                            clearFieldError('customer_type');
                                        }}
                                        options={[
                                            { label: 'Residential', value: '1' },
                                            { label: 'Enterprise', value: '2' },
                                        ]}
                                        placeholder="Select customer type"
                                        error={formErrors.customer_type}
                                        disabled={isFieldReadOnly('customer_type')}
                                    />


                                </div>
                                <>
                                    <FormSelect
                                        label="Customer Category"
                                        required
                                        id="customer_category"
                                        value={data?.customer_category}
                                        onChange={(val) => {
                                            setData('customer_category', val);
                                            setData('customer_subcategory', val === '1' ? '1' : '');
                                            clearFieldError('customer_category');
                                        }}
                                        options={categories}
                                        placeholder="Select category"
                                        error={formErrors.customer_category || categoriesError}
                                        loading={categoriesLoading}
                                        disabled={isFieldReadOnly('customer_category')}
                                    />
                                    <FormSelect
                                        label="Customer Subcategory"
                                        required
                                        id="customer_subcategory"
                                        value={data?.customer_subcategory}
                                        onChange={(val) => {
                                            setData('customer_subcategory', val);
                                            clearFieldError('customer_subcategory');
                                        }}
                                        options={subcategories}
                                        placeholder="Select subcategory"
                                        error={formErrors.customer_subcategory || subcategoriesError}
                                        loading={subcategoriesLoading}
                                        disabled={isFieldReadOnly('customer_subcategory')}
                                    />
                                </>
                                <FormSelect
                                    label="Title"
                                    id="title"
                                    required
                                    value={data.title || ''}
                                    onChange={(value) => handleSelectChange('title', value)}
                                    options={[
                                        { label: 'Mr.', value: '1' },
                                        { label: 'Mrs.', value: '2' },
                                        { label: 'Ms.', value: '3' },
                                        { label: 'Engineer', value: '6' },
                                        { label: 'Professor', value: '5' },
                                        { label: 'Doctor', value: '4' },
                                    ]}
                                    placeholder="Select title"
                                    error={formErrors.title}
                                    disabled={isFieldReadOnly('title')}
                                />

                                <FormInput
                                    label="First Name"
                                    id="first_name"
                                    required
                                    value={data.first_name ?? ""}
                                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                                    placeholder="Enter first name"
                                    error={formErrors.first_name}
                                    readOnly={!!isFieldReadOnly("first_name")}
                                    disabled={isFieldReadOnly('first_name')}
                                />

                                <FormInput
                                    label="Middle Name"
                                    id="middle_name"
                                    required
                                    value={data.middle_name}
                                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                                    placeholder=""
                                    error={formErrors.middle_name}
                                    readOnly={isFieldReadOnly('middle_name')}
                                />
                                <FormInput
                                    label="Last Name "
                                    id="last_name"
                                    required
                                    value={data.last_name}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    placeholder=""
                                    error={formErrors.last_name}
                                    readOnly={isFieldReadOnly('last_name')}
                                />
                                <FormSelect
                                    label="Gender"
                                    id="gender"
                                    required
                                    value={data.gender || ''}
                                    onChange={(value) => handleSelectChange('gender', value)}
                                    options={[
                                        { label: 'Male', value: '1' },
                                        { label: 'Female', value: '2' },
                                    ]}
                                    placeholder="Select gender"
                                    error={formErrors.gender}
                                    disabled={isFieldReadOnly('gender')}
                                />
                                <FormInput
                                    label="Date of Birth"
                                    id="date_of_birth"
                                    required
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                    placeholder=""
                                    error={formErrors.date_of_birth}
                                    readOnly={isFieldReadOnly('date_of_birth')}
                                />
                                <FormSelect
                                    label="Nationality"
                                    id="nationality"
                                    required
                                    value={data.nationality || ''}
                                    onChange={(value) => handleSelectChange('nationality', value)}
                                    options={[
                                        { label: 'Ethiopian', value: '1231' },
                                        { label: 'Other', value: '1000' },
                                    ]}
                                    placeholder=""
                                    error={formErrors.nationality}
                                    disabled={isFieldReadOnly('nationality')}
                                />
                                <FormSelect
                                    label="Primary Language"
                                    id="primary_language"
                                    required
                                    value={data.primary_language || ''}
                                    onChange={(value) => handleSelectChange('primary_language', value)}
                                    options={[
                                        { label: 'English', value: '2002' },
                                        { label: 'Amharic', value: '2060' },
                                        { label: 'Oromigna', value: '2061' },
                                        { label: 'Tigrigna', value: '2062' },
                                        { label: 'Somali', value: '2063' },
                                    ]}
                                    placeholder=""
                                    error={formErrors.primary_language}
                                    disabled={isFieldReadOnly('primary_language')}
                                />
                                <FormInput
                                    label="Place of Birth"
                                    id="place_of_birth"
                                    required
                                    autoFocus
                                    value={data.place_of_birth}
                                    onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                                    placeholder=""
                                    error={formErrors.place_of_birth}
                                    readOnly={isFieldReadOnly('place_of_birth')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}


                {step === 2 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
                                        <FileIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl">Identification</h2>
                                        <CardDescription className="text-gray-500">Identification documents and numbers</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormSelect
                                        label="Identification Type"
                                        id="identification_type"
                                        value={data.identification_type || ''}
                                        onChange={(value) => handleSelectChange('identification_type', value)}
                                        options={[{ label: 'National ID', value: '2' }]}
                                        placeholder="Select ID type"
                                        error={formErrors.identification_type}
                                        disabled={isFieldReadOnly('identification_type')}
                                    />
                                    <FormInput
                                        label="Identification Number"
                                        id="identification_number"
                                        value={data.identification_number}
                                        onChange={(e) => handleInputChange('identification_number', e.target.value)}
                                        placeholder="Enter ID number"
                                        error={formErrors.identification_number}
                                        readOnly={isFieldReadOnly('identification_number')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="">
                            <CardHeader className="">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
                                        <PhoneIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl">Contact Information</h2>
                                        <CardDescription className="text-gray-500">Phone numbers and email addresses</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormSelect
                                        label="Notification Mode"
                                        id="contact.notification_mode"
                                        value={data.contact?.notification_mode || ''}
                                        onChange={(val) => handleNestedInputChange('contact', 'notification_mode', val)}
                                        options={[
                                            { label: 'SMS', value: '1' },
                                            { label: 'Email', value: '2' },
                                        ]}
                                        placeholder="Select notification mode"
                                        error={formErrors['contact.notification_mode']}
                                        disabled={isFieldReadOnly('contact.notification_mode')}
                                    />
                                    <FormInput
                                        label="Phone Number"
                                        id="phone"
                                        required
                                        value={data.contact?.mobile_no || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'mobile_no', e.target.value)}
                                        placeholder="Enter mobile number"
                                        error={formErrors['contact.mobile_no']}
                                        readOnly={isFieldReadOnly('contact.mobile_no')}
                                    />
                                    <FormInput
                                        label="Email Address"
                                        id="email"
                                        required
                                        type="email"
                                        value={data.contact?.email || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                                        placeholder=""
                                        error={formErrors['contact.email']}
                                        readOnly={isFieldReadOnly('contact.email')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}


                {step === 3 && (
                    <Card className="">
                        <CardHeader className="">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
                                    <MapPinIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl">Address</h2>
                                    <CardDescription className="text-gray-500">Current residential address</CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormSelect
                                    label="Region"
                                    id="address.region"
                                    required
                                    value={data.address?.region}
                                    onChange={(val) => {
                                        setData('address', { ...data.address, region: val, zone: '', woreda: '' });
                                        clearFieldError('address.region');
                                    }}
                                    options={regionOptions}
                                    placeholder={loadingRegions ? 'Loading regions...' : 'Select region'}
                                    error={formErrors['address.region']}
                                    disabled={isFieldReadOnly('address.region')}
                                />
                                <FormSelect
                                    label="Zone"
                                    id="address.zone"
                                    required
                                    value={data.address?.zone}
                                    onChange={(val) => {
                                        setData('address', { ...data.address, zone: val, woreda: '' });
                                        clearFieldError('address.zone');
                                    }}
                                    options={data.address?.region ? zoneOptions : []}
                                    placeholder={data.address?.region ? (loadingZones ? 'Loading zones...' : 'Select zone') : 'First select region'}
                                    error={formErrors['address.zone']}
                                    disabled={isFieldReadOnly('address.zone')}
                                />
                                <FormSelect
                                    label="Woreda"
                                    id="address.woreda"
                                    required
                                    value={data.address?.woreda}
                                    onChange={(val) => {
                                        setData('address', { ...data.address, woreda: val });
                                        clearFieldError('address.woreda');
                                    }}
                                    options={data.address?.zone ? woredaOptions : []}
                                    placeholder={data.address?.zone ? (loadingWoredas ? 'Loading woredas...' : 'Select woreda') : 'First select zone'}
                                    error={formErrors['address.woreda']}
                                    disabled={isFieldReadOnly('address.woreda')}
                                />
                                <FormInput
                                    label="Kebele"
                                    id="address.kebele"
                                    value={data.address?.kebele}
                                    onChange={(e) => handleNestedInputChange('address', 'kebele', e.target.value)}
                                    placeholder=""
                                    error={formErrors['address.kebele']}
                                    readOnly={isFieldReadOnly('address.kebele')}
                                />
                                <FormInput
                                    label="House Number"
                                    id="address.house_no"
                                    value={data.address?.house_no}
                                    onChange={(e) => handleNestedInputChange('address', 'house_no', e.target.value)}
                                    placeholder=""
                                    error={formErrors['address.house_no']}
                                    readOnly={isFieldReadOnly('address.house_no')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <Card className="">
                            <CardHeader className="">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
                                        <Building className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl">Professional Information</h2>
                                        <CardDescription className="text-gray-500">Work and educational background</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormSelect
                                        label="Occupation"
                                        id="occupation"
                                        required
                                        value={data.occupation}
                                        onChange={(value) => handleSelectChange('occupation', value)}
                                        options={occupations}
                                        placeholder={loading ? 'Loading occupations...' : 'Select occupation'}
                                        error={formErrors.occupation || (occupationError ? occupationError : undefined)}
                                        disabled={loading || isFieldReadOnly('occupation')}
                                    />
                                    <FormSelect
                                        label="Education"
                                        id="education"
                                        required
                                        value={data.education || ''}
                                        onChange={(value) => handleSelectChange('education', value)}
                                        options={[
                                            { label: 'Illiterate', value: '1' },
                                            { label: 'Primary school', value: '2' },
                                            { label: 'Secondary school', value: '3' },
                                            { label: 'Diploma/certificate', value: '4' },
                                            { label: "Bachelor's degree", value: '5' },
                                            { label: "Master's degree and above", value: '6' },
                                            { label: 'Unknown', value: '70' },
                                            { label: 'Master', value: '90' },
                                            { label: 'Doctor', value: '100' },
                                            { label: 'Others', value: '110' },
                                            { label: 'Bachelor', value: '80' },
                                        ]}
                                        placeholder="Select education level"
                                        error={formErrors.education}
                                        disabled={isFieldReadOnly('education')}
                                    />
                                    <FormSelect
                                        label="Religion"
                                        id="religion"
                                        required
                                        value={data.religion || ''}
                                        onChange={(value) => handleSelectChange('religion', value)}
                                        options={[
                                            { label: 'Christianity', value: '1' },
                                            { label: 'Islam', value: '2' },
                                            { label: 'Catholics', value: '4' },
                                            { label: 'Orthodox', value: '5' },
                                            { label: 'Protestant', value: '6' },
                                            { label: 'Other', value: '3' },
                                        ]}
                                        placeholder="Select religion"
                                        error={formErrors.religion}
                                        disabled={isFieldReadOnly('religion')}
                                    />
                                    <FormSelect
                                        label="Income Level"
                                        id="income"
                                        required
                                        value={data.income}
                                        onChange={(value) => handleSelectChange('income', value)}
                                        options={[
                                            { label: 'Birr 0-999', value: '1' },
                                            { label: 'Birr 1,000-1,999', value: '2' },
                                            { label: 'Birr 2,000-3,499', value: '3' },
                                            { label: 'Birr 3,500-4,999', value: '4' },
                                            { label: 'Birr 5,000-7,999', value: '5' },
                                            { label: 'Birr 8,000-15,000', value: '6' },
                                            { label: 'Above Birr 15,000', value: '7' },
                                        ]}
                                        placeholder="Select income level"
                                        error={formErrors.income}
                                        disabled={isFieldReadOnly('income')}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="">
                            <CardHeader className="">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
                                        <UserIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl">Contact Person</h2>
                                        <CardDescription className="text-gray-500">Emergency or alternate contact (Optional)</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormSelect
                                            label="Title"
                                            id="contact_person_title"
                                            value={contactPerson.title || ''}
                                            onChange={(val) => updateContactPerson('title', val)}
                                            options={[
                                                { label: 'Mr.', value: '1' },
                                                { label: 'Mrs.', value: '2' },
                                                { label: 'Ms.', value: '3' },
                                                { label: 'Engineer', value: '6' },
                                                { label: 'Professor', value: '5' },
                                                { label: 'Doctor', value: '4' },
                                            ]}
                                            placeholder="Select title"
                                        />
                                        <FormInput
                                            label="First Name"
                                            id="contact_person_first_name"
                                            value={contactPerson.first_name}
                                            onChange={(e) => updateContactPerson('first_name', e.target.value)}
                                            placeholder="Enter first name"
                                        />
                                        <FormInput
                                            label="Middle Name"
                                            id="contact_person_middle_name"
                                            value={contactPerson.middle_name}
                                            onChange={(e) => updateContactPerson('middle_name', e.target.value)}
                                            placeholder="Enter middle name"
                                        />
                                        <FormInput
                                            label="Last Name"
                                            id="contact_person_last_name"
                                            value={contactPerson.last_name}
                                            onChange={(e) => updateContactPerson('last_name', e.target.value)}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormInput
                                            label="Mobile Number"
                                            id="contact_person_mobile_no"
                                            value={contactPerson.mobile_no}
                                            onChange={(e) => updateContactPerson('mobile_no', e.target.value)}
                                            placeholder="Enter mobile number"
                                        />
                                        <FormInput
                                            label="Home Number"
                                            id="contact_person_home_no"
                                            value={contactPerson.home_no}
                                            onChange={(e) => updateContactPerson('home_no', e.target.value)}
                                            placeholder="Enter home number"
                                        />
                                        <FormInput
                                            label="Office Number"
                                            id="contact_person_office_no"
                                            value={contactPerson.office_no}
                                            onChange={(e) => updateContactPerson('office_no', e.target.value)}
                                            placeholder="Enter office number"
                                        />
                                        <FormInput
                                            label="Fax Number"
                                            id="contact_person_fax_no"
                                            value={contactPerson.fax_no}
                                            onChange={(e) => updateContactPerson('fax_no', e.target.value)}
                                            placeholder="Enter fax number"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                <div className="flex justify-between rounded-lg bg-gray-50 p-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    {step < 4 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={step === 1 && (!data.first_name || !data.last_name)}
                            className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md`}
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={submit}
                            disabled={processing || uploadingPhoto}
                            className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md ${uploadingPhoto ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                        >
                            {uploadingPhoto ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Submit Customer
                                    <CheckCircle className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
