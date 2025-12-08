import FormInput from '@/components/form-input';
import FormSelect from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useCustomerCategories, useCustomerSubcategories, useCustomerTypes } from '@/hooks/use-customer-types';
import { useOccupations } from '@/hooks/use-occupations';
import { useRegions, useWoredas, useZones } from '@/hooks/use-regions';
import AuthLayout from '@/layouts/AuthLayout';
import GuestLayout from '@/layouts/GuestLayout';
import { CustomerFormValues, customerSchema } from '@/types/customer';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Building, CheckCircle, FileText, Home, MapPin, Phone, Upload, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Add this interface for page props
interface PageProps {
    prefillData?: any;
    customerId?: number;
    photoBase64?: string;
}

export default function Create() {
    const { auth } = usePage().props;
    const { user } = auth;
    const { props } = usePage<PageProps>();
    const { prefillData, photoBase64 } = props;

    const { occupations, loading, error: occupationError } = useOccupations();
    const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [customerCreated, setCustomerCreated] = useState(false);
    const [createdCustomerData, setCreatedCustomerData] = useState<any>(null);

    const { data, setData, processing } = useForm<CustomerFormValues>('createCustomer', {
        first_name: '',
        middle_name: '',
        last_name: '',
        title: undefined,
        gender: undefined,
        nationality: '',
        identification_type: undefined,
        identification_number: '',
        date_of_birth: '',
        place_of_birth: '',
        occupation: undefined,
        education: undefined,
        religion: undefined,
        income: undefined,
        primary_language: '',
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
            notification_mode: '',
            mobile_no: '',
            office_no: '',
            email: '',
            home_no: '',
            fax_no: '',
        },
        contact_person: [],
        customer_type: undefined,
        customer_category: undefined,
        customer_subcategory: undefined,
        customer_level: '2',
    });

    // Get NID data from session storage or local storage
    const [nidData, setNidData] = useState<any>(null);

    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                if (prefillData) {
                    setData((prev) => ({
                        ...prev,
                        first_name: prefillData.first_name || '',
                        middle_name: prefillData.middle_name || '',
                        last_name: prefillData.last_name || '',
                        title: prefillData.title || '',
                        gender: prefillData.gender?.toLowerCase() === 'male' ? '1' : '2',
                        nationality: prefillData.nationality?.toLowerCase() === 'ethiopia' ? '1231' : '1000',
                        date_of_birth: prefillData.date_of_birth,
                        place_of_birth: prefillData.place_of_birth || '',
                        identification_type: prefillData.identification_type || '2',
                        identification_number: prefillData.identification_number || '',
                        contact: {
                            ...prev.contact,
                            ...(prefillData.contact || {}),
                        },
                        address: {
                            ...prev.address,
                            ...(prefillData.address || {}),
                        },
                        occupation: prefillData.occupation || '',
                        education: prefillData.education || '',
                        religion: prefillData.religion || '',
                        income: prefillData.income || '',
                        primary_language: prefillData.primary_language || '',
                        customer_type: prefillData.customer_type || '',
                        customer_category: prefillData.customer_category || '',
                        customer_subcategory: prefillData.customer_subcategory || '',
                        contact_person: prefillData.contact_person || [],
                    }));
                    if (photoBase64) {
                        localStorage.setItem('customer_photo_base64', photoBase64);
                    }
                } else {
                    const response = await axios.get('/api/v1/customer', {
                        params: { customer_sub_id: user.customer_sub_id },
                    });
                    if (response.data?.success && response.data?.data) {
                        const customer = response.data.data;
                        const transform = {
                            gender: customer.gender?.toLowerCase() === 'male' ? '1' : '2',
                            nationality: customer.nationality?.toLowerCase() === 'ethiopia' ? '1231' : '1000',
                        };
                        setData((prev) => ({
                            ...prev,
                            ...customer,
                            ...transform,
                            contact: {
                                ...prev.contact,
                                ...(customer.contact || {}),
                            },
                            address: {
                                ...prev.address,
                                ...(customer.address || {}),
                            },
                        }));

                        if (customer.photo_base64) {
                            localStorage.setItem('customer_photo_base64', customer.photo_base64);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching customer data:', error);
            }
        };

        fetchCustomerData();
    }, [prefillData, photoBase64, setData, user.customer_sub_id]);

    const { types, loading: typesLoading, error: typesError } = useCustomerTypes();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCustomerCategories(data.customer_type);
    const { subcategories, loading: subcategoriesLoading, error: subcategoriesError } = useCustomerSubcategories(data.customer_category);

    const { regions: regionOptions, loading: loadingRegions } = useRegions();
    const { zones: zoneOptions, loading: loadingZones } = useZones(data.address?.region);
    const { woredas: woredaOptions, loading: loadingWoredas } = useWoredas(data.address?.zone);

    const [contactPersons, setContactPersons] = useState(data.contact_person || []);
    useEffect(() => {
        setData('contact_person', contactPersons);
    }, [contactPersons, setData]);

    const addContactPerson = () =>
        setContactPersons((prev) => [
            ...prev,
            { first_name: '', middle_name: '', last_name: '', title: undefined, mobile_no: '', office_no: '', home_no: '', fax_no: '' },
        ]);
    const removeContactPerson = (i: number) => setContactPersons((prev) => prev.filter((_, idx) => idx !== i));
    const updateContactPerson = (i: number, field: string, val: string) =>
        setContactPersons((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setFormErrors({});

        const result = customerSchema.safeParse(data);
        if (!result.success) {
            // Handle validation errors
            const fieldErrors: Record<string, string> = {};
            for (const [key, val] of Object.entries(result.error.flatten().fieldErrors)) {
                if (val && val.length > 0) fieldErrors[key] = val[0];
            }
            setFormErrors(fieldErrors);
            return;
        }

        try {
            // --- STEP 1: CREATE CUSTOMER ---
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/customer/create`, {
                ...result.data,
                date_of_birth: result.data.date_of_birth ? result.data.date_of_birth.replace(/-/g, '') : null,
            });

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
                transaction_id: transactionId, // ✅ comma fixed
                photo: photoBase64, // ✅ base64 string
            };

            await axios.post('/api/v1/ecaf-upload', ecafData);

            return { success: true };
        } catch (error: any) {
            console.error('ECAF upload error:', error);
            return { success: false, message: error?.message || 'Upload failed' };
        } finally {
            setUploadingPhoto(false);
        }
    };
    const handleInputChange = (field: string, value: string) => {
        setData(field, value);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const handleNestedInputChange = (parent: string, field: string, value: string) => {
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
        <div className="mb-6 flex items-center justify-center space-x-0 sm:space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                    <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium transition-all sm:h-10 sm:w-10 ${
                            step >= stepNumber ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'
                        } ${step === stepNumber ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                    >
                        {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                    </div>
                    {stepNumber < 4 && <div className={`mx-2 h-1 w-16 transition-all ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`} />}
                </div>
            ))}
        </div>
    );

    // Show loading state when uploading photo
    if (uploadingPhoto) {
        return (
            <GuestLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                            <h2 className="text-xl font-semibold">Uploading Customer Photo</h2>
                            <p className="text-gray-600">Please wait while we upload the photo from your National ID...</p>
                        </CardContent>
                    </Card>
                </div>
            </GuestLayout>
        );
    }

    return (
        <AuthLayout>
            <Head title="Create Customer" />

            {/* Photo Upload Status */}
            {nidData && (nidData.nid_identity?.photo_base64 || nidData.identity?.photo_base64) && (
                <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                            <Upload className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-800">National ID Photo Available</p>
                                <p className="text-sm text-blue-600">
                                    Your photo from National ID verification will be automatically uploaded after customer creation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                </div>

                {renderStepIndicator()}

                {/* 1: Personal Information */}
                {step === 1 && (
                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="bg-gray-50">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Personal Information</h2>
                                    <CardDescription className="text-gray-400">Basic personal details of the customer</CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Updated Customer Type */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="customer_type">Customer Type *</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                data.customer_type === '1' ? 'border-green-500 bg-green-50 shadow-sm' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                setData('customer_type', '1');
                                                setData('customer_category', '');
                                                setData('customer_subcategory', '');
                                                clearFieldError('customer_type');
                                            }}
                                        >
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                    data.customer_type === '1' ? 'bg-green-100' : 'bg-gray-100'
                                                }`}
                                            >
                                                <Home className={`h-6 w-6 ${data.customer_type === '1' ? 'text-green-600' : 'text-gray-600'}`} />
                                            </div>
                                            <span className="font-medium">Residential</span>
                                            <span className="text-center text-xs text-gray-500">For home and personal use</span>
                                            <input
                                                type="radio"
                                                id="residential"
                                                name="customer_type"
                                                value="residential"
                                                checked={data.customer_type === '1'}
                                                onChange={() => {}}
                                                className="sr-only"
                                            />
                                        </div>
                                        <div
                                            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                                data.customer_type === '2' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                setData('customer_type', '2');
                                                setData('customer_category', '');
                                                setData('customer_subcategory', '');
                                                clearFieldError('customer_type');
                                            }}
                                        >
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                                    data.customer_type === '2' ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}
                                            >
                                                <Building className={`h-6 w-6 ${data.customer_type === '2' ? 'text-blue-600' : 'text-gray-600'}`} />
                                            </div>
                                            <span className="font-medium">Enterprise</span>
                                            <span className="text-center text-xs text-gray-500">For business and organizations</span>
                                            <input
                                                type="radio"
                                                id="enterprise"
                                                name="customer_type"
                                                value="enterprise"
                                                checked={data.customer_type === '2'}
                                                onChange={() => {}}
                                                className="sr-only"
                                            />
                                        </div>
                                    </div>
                                    {typesLoading && <p className="text-sm text-gray-500">Loading customer types...</p>}
                                    {formErrors.customer_type && <p className="text-sm font-medium text-destructive">{formErrors.customer_type}</p>}
                                </div>
                                {/* Customer Category and Subcategory */}
                                <>
                                    <FormSelect
                                        label="Customer Category"
                                        id="customer_category"
                                        value={data.customer_category}
                                        onChange={(val) => {
                                            setData('customer_category', val);
                                            setData('customer_subcategory', '');
                                            clearFieldError('customer_category');
                                        }}
                                        options={categories}
                                        placeholder="Select category"
                                        error={formErrors.customer_category || categoriesError}
                                        loading={categoriesLoading}
                                    />
                                    <FormSelect
                                        label="Customer Subcategory"
                                        id="customer_subcategory"
                                        value={data.customer_subcategory}
                                        onChange={(val) => {
                                            setData('customer_subcategory', val);
                                            clearFieldError('customer_subcategory');
                                        }}
                                        options={subcategories}
                                        placeholder="Select subcategory"
                                        error={formErrors.customer_subcategory || subcategoriesError}
                                        loading={subcategoriesLoading}
                                    />
                                </>
                                <FormSelect
                                    label="Title"
                                    id="title"
                                    value={data.title || '1'}
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
                                />
                                <FormInput
                                    label="First Name *"
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    placeholder="Enter first name"
                                    error={formErrors.first_name}
                                />
                                <FormInput
                                    label="Middle Name"
                                    id="middle_name"
                                    value={data.middle_name}
                                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                                    placeholder="Enter middle name"
                                    error={formErrors.middle_name}
                                />
                                <FormInput
                                    label="Last Name *"
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    placeholder="Enter last name"
                                    error={formErrors.last_name}
                                />
                                <FormSelect
                                    label="Gender"
                                    id="gender"
                                    value={data.gender || ''}
                                    onChange={(value) => handleSelectChange('gender', value)}
                                    options={[
                                        { label: 'Male', value: '1' },
                                        { label: 'Female', value: '2' },
                                    ]}
                                    placeholder="Select gender"
                                    error={formErrors.gender}
                                />
                                <FormInput
                                    label="Date of Birth"
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                    placeholder=""
                                    error={formErrors.date_of_birth}
                                />
                                <FormInput
                                    label="Place of Birth"
                                    id="place_of_birth"
                                    value={data.place_of_birth}
                                    onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                                    placeholder="Enter place of birth"
                                    error={formErrors.place_of_birth}
                                />
                                <FormSelect
                                    label="Nationality"
                                    id="nationality"
                                    value={data.nationality || '1231'}
                                    onChange={(value) => handleSelectChange('nationality', value)}
                                    options={[
                                        { label: 'Ethiopia', value: '1231' },
                                        { label: 'Other', value: '1000' },
                                    ]}
                                    placeholder="Select nationality"
                                    error={formErrors.nationality}
                                />
                                <FormSelect
                                    label="Primary Language"
                                    id="primary_language"
                                    value={data.primary_language || '2060'}
                                    onChange={(value) => handleSelectChange('primary_language', value)}
                                    options={[
                                        { label: 'English', value: '2002' },
                                        { label: 'Amharic', value: '2060' },
                                        { label: 'Oromigna', value: '2061' },
                                        { label: 'Tigrigna', value: '2062' },
                                        { label: 'Somali', value: '2063' },
                                    ]}
                                    placeholder="Select primary language"
                                    error={formErrors.primary_language}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 2: Identification */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Identification</h2>
                                        <CardDescription className="text-gray-600">Identification documents and numbers</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormSelect
                                        label="Identification Type"
                                        id="identification_type"
                                        value={data.identification_type || '2'}
                                        onChange={(value) => handleSelectChange('identification_type', value)}
                                        options={[
                                            { label: 'Passport', value: '1' },
                                            { label: 'National ID', value: '2' },
                                            { label: 'Driver License', value: '3' },
                                            { label: 'Student Id', value: '4' },
                                            { label: 'TIN No', value: '5' },
                                            { label: 'Other', value: '6' },
                                            { label: 'House Number', value: '7' },
                                            { label: 'Corporate Letter', value: '8' },
                                            { label: 'Kebele ID', value: '9' },
                                        ]}
                                        placeholder="Select ID type"
                                        error={formErrors.identification_type}
                                    />
                                    <FormInput
                                        label="Identification Number"
                                        id="identification_number"
                                        value={data.identification_number}
                                        onChange={(e) => handleInputChange('identification_number', e.target.value)}
                                        placeholder="Enter ID number"
                                        error={formErrors.identification_number}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Contact Information</h2>
                                        <CardDescription className="text-gray-600">Phone numbers and email addresses</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormSelect
                                        label="Notification Mode"
                                        id="contact.notification_mode"
                                        value={data.contact?.notification_mode || '1'}
                                        onChange={(val) => handleNestedInputChange('contact', 'notification_mode', val)}
                                        options={[
                                            { label: 'SMS', value: '1' },
                                            { label: 'Email', value: '2' },
                                        ]}
                                        placeholder="Select notification mode"
                                        error={formErrors['contact.notification_mode']}
                                    />
                                    <FormInput
                                        label="Phone Number (start with 09)"
                                        id="phone"
                                        value={data.contact?.mobile_no || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'mobile_no', e.target.value)}
                                        placeholder="Enter mobile number"
                                        error={formErrors['contact.mobile_no']}
                                    />
                                    <FormInput
                                        label="Office Number (length 9 to 20)"
                                        id="office"
                                        value={data.contact?.office_no || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'office_no', e.target.value)}
                                        placeholder="Enter office number"
                                        error={formErrors['contact.office_no']}
                                    />
                                    <FormInput
                                        label="Email Address"
                                        id="email"
                                        type="email"
                                        value={data.contact?.email || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                                        placeholder="Enter email address"
                                        error={formErrors['contact.email']}
                                    />
                                    <FormInput
                                        label="Home Number (length 9 to 20)"
                                        id="home"
                                        value={data.contact?.home_no || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'home_no', e.target.value)}
                                        placeholder="Enter home number"
                                        error={formErrors['contact.home_no']}
                                    />
                                    <FormInput
                                        label="Fax Number (length 9 to 20)"
                                        id="fax_no"
                                        value={data.contact?.fax_no || ''}
                                        onChange={(e) => handleNestedInputChange('contact', 'fax_no', e.target.value)}
                                        placeholder="Enter fax number"
                                        error={formErrors['contact.fax_no']}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 3: Address */}
                {step === 3 && (
                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="rounded-t-lg border-b bg-gray-50">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Address</h2>
                                    <CardDescription className="text-gray-600">Current residential address</CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormSelect
                                    label="Region"
                                    id="address.region"
                                    value={data.address?.region}
                                    onChange={(val) => {
                                        setData('address', { ...data.address, region: val, zone: '', woreda: '' });
                                        clearFieldError('address.region');
                                    }}
                                    options={regionOptions}
                                    placeholder={loadingRegions ? 'Loading regions...' : 'Select region'}
                                    error={formErrors['address.region']}
                                />
                                <FormSelect
                                    label="Zone"
                                    id="address.zone"
                                    value={data.address?.zone}
                                    onChange={(val) => {
                                        setData('address', { ...data.address, zone: val, woreda: '' });
                                        clearFieldError('address.zone');
                                    }}
                                    options={data.address?.region ? zoneOptions : []}
                                    placeholder={data.address?.region ? (loadingZones ? 'Loading zones...' : 'Select zone') : 'First select region'}
                                    error={formErrors['address.zone']}
                                />
                                <FormSelect
                                    label="Woreda"
                                    id="address.woreda"
                                    value={data.address?.woreda}
                                    onChange={(val) => {
                                        setData('address', { ...data.address, woreda: val });
                                        clearFieldError('address.woreda');
                                    }}
                                    options={data.address?.zone ? woredaOptions : []}
                                    placeholder={data.address?.zone ? (loadingWoredas ? 'Loading woredas...' : 'Select woreda') : 'First select zone'}
                                    error={formErrors['address.woreda']}
                                />
                                <FormInput
                                    label="City (accepted value: 1-16)"
                                    id="address.city"
                                    value={data.address?.city}
                                    onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                                    placeholder="Enter city accepted value: 1-16"
                                    error={formErrors['address.city']}
                                />
                                <FormInput
                                    label="Street Name (optional)"
                                    id="address.street_name"
                                    value={data.address?.street_name}
                                    onChange={(e) => handleNestedInputChange('address', 'street_name', e.target.value)}
                                    placeholder="Enter street name"
                                    error={formErrors['address.street_name']}
                                />
                                <FormInput
                                    label="Kebele"
                                    id="address.kebele"
                                    value={data.address?.kebele}
                                    onChange={(e) => handleNestedInputChange('address', 'kebele', e.target.value)}
                                    placeholder="Enter kebele"
                                    error={formErrors['address.kebele']}
                                />
                                <FormInput
                                    label="House Number"
                                    id="address.house_no"
                                    value={data.address?.house_no}
                                    onChange={(e) => handleNestedInputChange('address', 'house_no', e.target.value)}
                                    placeholder="Enter house number"
                                    error={formErrors['address.house_no']}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4: Professional Information */}
                {step === 4 && (
                    <div className="space-y-6">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <Building className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Professional Information</h2>
                                        <CardDescription className="text-gray-600">Work and educational background</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormSelect
                                        label="Occupation"
                                        id="occupation"
                                        value={data.occupation}
                                        onChange={(value) => handleSelectChange('occupation', value)}
                                        options={occupations}
                                        placeholder={loading ? 'Loading occupations...' : 'Select occupation'}
                                        error={formErrors.occupation || (occupationError ? occupationError : undefined)}
                                        disabled={loading}
                                    />
                                    <FormSelect
                                        label="Education"
                                        id="education"
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
                                    />
                                    <FormSelect
                                        label="Religion"
                                        id="religion"
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
                                    />
                                    <FormSelect
                                        label="Income Level"
                                        id="income"
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
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="rounded-t-lg border-b bg-gray-50">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Contact Person</h2>
                                        <CardDescription className="text-gray-600">Emergency or alternate contact</CardDescription>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {contactPersons.map((person, i) => (
                                    <div key={i} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-medium text-gray-800">Contact Person</h4>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeContactPerson(i)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormSelect
                                                label="Title"
                                                id={`title_${i}`}
                                                value={person.title}
                                                onChange={(value) => updateContactPerson(i, 'title', value)}
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
                                            />
                                            <FormInput
                                                label="First Name"
                                                id={`first_name_${i}`}
                                                value={person.first_name}
                                                onChange={(e) => updateContactPerson(i, 'first_name', e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                            <FormInput
                                                label="Middle Name"
                                                id={`middle_name_${i}`}
                                                value={person.middle_name}
                                                onChange={(e) => updateContactPerson(i, 'middle_name', e.target.value)}
                                                placeholder="Enter middle name"
                                            />
                                            <FormInput
                                                label="Last Name"
                                                id={`last_name_${i}`}
                                                value={person.last_name}
                                                onChange={(e) => updateContactPerson(i, 'last_name', e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormInput
                                                label="Mobile No"
                                                id={`mobile_no_${i}`}
                                                value={person.mobile_no}
                                                onChange={(e) => updateContactPerson(i, 'mobile_no', e.target.value)}
                                                placeholder="Enter mobile number"
                                            />
                                            <FormInput
                                                label="Home No"
                                                id={`home_no_${i}`}
                                                value={person.home_no}
                                                onChange={(e) => updateContactPerson(i, 'home_no', e.target.value)}
                                                placeholder="Enter home number"
                                            />
                                            <FormInput
                                                label="Office No"
                                                id={`office_no_${i}`}
                                                value={person.office_no}
                                                onChange={(e) => updateContactPerson(i, 'office_no', e.target.value)}
                                                placeholder="Enter office number"
                                            />
                                            <FormInput
                                                label="Fax No"
                                                id={`fax_no_${i}`}
                                                value={person.fax_no}
                                                onChange={(e) => updateContactPerson(i, 'fax_no', e.target.value)}
                                                placeholder="Enter fax number"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addContactPerson}
                                    disabled={contactPersons.length > 0}
                                    className="w-full border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    + Add Contact Person
                                </Button>
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
                            className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md ${
                                uploadingPhoto ? 'cursor-not-allowed opacity-50' : ''
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
