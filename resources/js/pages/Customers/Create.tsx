import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerCategories, useCustomerSubcategories, useCustomerTypes } from '@/hooks/use-customer-types';
import { useOccupations } from '@/hooks/use-occupations';
import { useRegions, useWoredas, useZones } from '@/hooks/use-regions';
import AuthLayout from '@/layouts/AuthLayout';
import { cn } from '@/lib/utils';
import { FormSelectProps } from '@/types';
import { CustomerFormValues, customerSchema } from '@/types/customer';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios, { AxiosError } from 'axios';
import { Building, CheckCircle, FileIcon, MapPinIcon, PhoneIcon, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Error types for better error handling
type ApiError = {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
};

type SubmissionState = {
    isSubmitting: boolean;
    isUploadingPhoto: boolean;
    error: ApiError | null;
    success: boolean;
};

type FieldError = {
    field: string;
    message: string;
};

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
                {required && <span className="text-red-500">*</span>}
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
                        {options?.map((opt) => (
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
    autoFocus?: boolean;
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
    autoFocus,
    placeholder = '',
    error,
    type = 'text',
    required = false,
    readOnly = false,
    disabled = false,
}: FormInputProps) {
    const safeValue = value ?? '';
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    `${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary'} focus:border-2 focus:border-primary focus:outline-none`,
                )}
                id={id}
                value={safeValue}
                onChange={onChange}
                autoFocus={autoFocus}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={disabled}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

// Utility function to handle API errors
const handleApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
            message?: string;
            errors?: Record<string, string[]>;
            success?: boolean;
        }>;

        return {
            message: axiosError.response?.data?.message || axiosError.message || 'An API error occurred',
            errors: axiosError.response?.data?.errors,
            status: axiosError.response?.status,
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
        };
    }

    return {
        message: 'An unexpected error occurred',
    };
};

// Parse Zod errors into field-specific errors
const parseZodErrors = (zodError: z.ZodError): FieldError[] => {
    return zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
    }));
};

export default function Create() {
    const { auth } = usePage().props;
    const { user } = auth;

    const { occupations, loading: occupationsLoading, error: occupationError } = useOccupations();
    // const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submissionState, setSubmissionState] = useState<SubmissionState>({
        isSubmitting: false,
        isUploadingPhoto: false,
        error: null,
        success: false,
    });
    const [createdCustomerData, setCreatedCustomerData] = useState<any>(null);
    console.log('🚀 ~ Create ~ createdCustomerData:', createdCustomerData);

    const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());
    console.log('🚀 ~ Create ~ readOnlyFields:', readOnlyFields);
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
        'nationality',
        'identification_type',
        'contact.notification_mode',
        'contact.mobile_no',
    ];

    // Enhanced prefill data loading with better error handling
    useEffect(() => {
        const loadDataFromApi = async () => {
            try {
                setIsLoadingPrefill(true);
                setSubmissionState((prev) => ({ ...prev, error: null }));

                if (user?.customer_sub_id) {
                    const response = await axios.get('/api/v1/customer', {
                        params: { customer_sub_id: user?.customer_sub_id },
                        headers: {
                            Authorization: `Bearer ${user?.api_token}`,
                        },
                        timeout: 10000, // 10 second timeout
                    });
                    console.log('🚀 ~ loadDataFromApi ~ response:', response);

                    if (response.data?.success && response.data?.data) {
                        const customer = response.data.data;

                        // Show success toast for prefill
                        toast.success('Customer data loaded successfully', {
                            description: 'Some fields are pre-filled from existing data',
                            duration: 3000,
                        });

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
                                region: customer.address?.regionne || customer.regionn || '',
                                zone: customer.address?.zonee || customer.zonee || '',
                                woreda: customer.address?.woredaa || customer.woredaa || '',
                                city: customer.address?.cityy || customer.cityy || '',
                                street_name: customer.address?.street_name || customer.street_name || '',
                                kebele: customer.address?.kebele || customer.kebele || '',
                                house_no: customer.address?.house_no || customer.house_no || '',
                            },
                            contact_person: customer.contact_person || [],
                            customer_level: customer.customer_level || '2',
                        };
                        console.log('transfored data', transform);

                        setData(transform);

                        const newReadOnlyFields = new Set<string>();
                        API_READONLY_FIELDS.forEach((field) => {
                            if (field === 'contact.mobile_no') {
                                if (transform.contact?.mobile_no) newReadOnlyFields.add(field);
                            } else if (field === 'contact.notification_mode') {
                                if (transform.contact?.notification_mode) newReadOnlyFields.add(field);
                            } else {
                                // @ts-ignore - dynamic access based on field name
                                if (transform[field]) newReadOnlyFields.add(field);
                            }
                        });
                        setReadOnlyFields(newReadOnlyFields);

                        if (customer.photo_base64) {
                            localStorage.setItem('customer_photo_base64', customer.photo_base64);
                        }
                    } else {
                        toast.info('Starting with new customer form', {
                            description: 'No existing customer data found',
                            duration: 3000,
                        });
                    }
                }
            } catch (error) {
                const apiError = handleApiError(error);
                console.error('Error loading data from API:', apiError);

                toast.error('Failed to load customer data', {
                    description: apiError.message,
                    duration: 5000,
                });

                setSubmissionState((prev) => ({ ...prev, error: apiError }));
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
            ? data.contact_person[0]
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
    const updateContactPerson = (field: string, val: string) => {
        const errorKey = `contact_person.0.${field}`;
        setContactPerson((prev) => ({ ...prev, [field]: val }));
        setFormErrors((prev) => {
            const next = { ...prev };
            delete next[errorKey];
            delete next.contact_person;
            return next;
        });
    };

    // Sync contact person with form data
    useEffect(() => {
        setData('contact_person', [contactPerson]);
    }, [contactPerson, setData]);

    // Check if a field is read-only
    const isFieldReadOnly = (fieldName: string): boolean => {
        return readOnlyFields.has(fieldName);
    };

    // Enhanced submit handler with comprehensive error handling
    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        console.log('hiiiiii');
        // Clear previous errors
        setFormErrors({});
        setSubmissionState({
            isSubmitting: true,
            isUploadingPhoto: false,
            error: null,
            success: false,
        });

        // Start toast for submission
        const submissionToast = toast.loading('Validating form data...', {
            duration: Infinity,
        });
        console.log('🚀 ~ submit ~ submissionToast:', submissionToast);

        try {
            // Step 1: Validate form data
            const result = customerSchema.safeParse(data);
            console.log('🚀 ~ submit ~ result:', result);

            if (!result.success) {
                const fieldErrors: Record<string, string> = {};

                for (const issue of result.error.issues) {
                    const key = issue.path.join('.');
                    if (key) {
                        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
                    } else {
                        if (!fieldErrors._form) fieldErrors._form = issue.message;
                    }
                }

                setFormErrors(fieldErrors);

                toast.error('Form validation failed', {
                    id: submissionToast,
                    description: 'Please check all required fields',
                    duration: 5000,
                });

                setSubmissionState((prev) => ({
                    ...prev,
                    isSubmitting: false,
                }));
                return;
            }

            // Update toast to show creation in progress
            toast.loading('Creating customer...', {
                id: submissionToast,
            });
            console.log('🚀 ~ submit ~ submissionToast:', submissionToast);
            // Step 2: Create customer
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/customer/create`,
                {
                    ...result.data,
                    date_of_birth: result.data.date_of_birth ? result.data.date_of_birth.replace(/-/g, '') : null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user?.api_token}`,
                        'Content-Type': 'application/json',
                    },
                    // timeout: 30000, // 30 second timeout for customer creation
                },
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Customer creation failed');
            }

            // Check for nested error in data.original (common in some Laravel API wrappers)
            if (response.data.data?.original && response.data.data.original.success === false) {
                throw new Error(response.data.data.original.message || 'Customer creation failed');
            }

            const customer = response.data.data?.original?.data || response.data.data;
            setCreatedCustomerData(customer);

            // Update toast to show success
            toast.success('Customer created successfully!', {
                id: submissionToast,
                description: 'Now processing photo upload...',
                duration: 3000,
            });

            // Step 3: Upload photo if exists
            const base64Photo = localStorage.getItem('customer_photo_base64');
            if (base64Photo) {
                setSubmissionState((prev) => ({
                    ...prev,
                    isUploadingPhoto: true,
                }));

                const photoToast = toast.loading('Uploading customer photo...', {
                    description: 'Please wait',
                    duration: Infinity,
                });

                try {
                    const uploadResult = await uploadPhotoToEcaf(customer, base64Photo);

                    if (uploadResult.success) {
                        toast.success('Photo uploaded successfully!', {
                            id: photoToast,
                            duration: 3000,
                        });
                    } else {
                        toast.warning('Customer created but photo upload failed', {
                            id: photoToast,
                            description: uploadResult.message,
                            duration: 5000,
                        });
                    }
                } catch (photoError) {
                    const apiError = handleApiError(photoError);
                    toast.error('Photo upload failed', {
                        id: photoToast,
                        description: apiError.message,
                        duration: 5000,
                    });
                } finally {
                    setSubmissionState((prev) => ({
                        ...prev,
                        isUploadingPhoto: false,
                    }));
                }
            }

            // Step 4: Final success state
            setSubmissionState({
                isSubmitting: false,
                isUploadingPhoto: false,
                error: null,
                success: true,
            });

            // Show final success message
            toast.success('Customer setup completed!', {
                description: 'Redirecting to services page...',
                duration: 3000,
            });

            // Cleanup and redirect
            sessionStorage.removeItem('pending_customer_id');
            localStorage.removeItem('customer_photo_base64');

            // Redirect after a brief delay to show success message
            setTimeout(() => {
                router.get(route('services'));
            }, 2000);
        } catch (error) {
            const apiError = handleApiError(error);

            // Handle API validation errors
            if (apiError.errors) {
                const fieldErrors: Record<string, string> = {};
                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    fieldErrors[field] = messages[0]; // Take first error message
                });
                setFormErrors(fieldErrors);
            }

            // Update submission state
            setSubmissionState({
                isSubmitting: false,
                isUploadingPhoto: false,
                error: apiError,
                success: false,
            });

            // Show error toast
            toast.error('Failed to create customer', {
                id: submissionToast,
                description: apiError.message,
                duration: 10000,
                action: {
                    label: 'Retry',
                    onClick: () => submit(e),
                },
            });

            // Scroll to top to show errors
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const uploadPhotoToEcaf = async (customerData: any, photoBase64: string) => {
        try {
            const ecafData = {
                cust_code: customerData.customer_code || customerData.customer_id,
                first_name: data.first_name,
                last_name: data.last_name,
                other_name: data.middle_name || '',
                transaction_id: customerData.transaction_id || `txn_${Date.now()}`,
                photo: photoBase64,
            };

            const response = await axios.post('/api/v1/ecaf-upload', ecafData, {
                headers: {
                    Authorization: `Bearer ${user.api_token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000, // 60 second timeout for photo upload
            });

            if (response.data?.status === 'success' || response.data?.success) {
                return { success: true, data: response.data };
            }

            return {
                success: false,
                message: response.data?.message || 'ECAF upload failed',
            };
        } catch (error: any) {
            const apiError = handleApiError(error);
            return {
                success: false,
                message: apiError.message || 'Upload failed',
            };
        }
    };

    // Enhanced change handlers
    const handleInputChange = (field: string, value: string) => {
        if (isFieldReadOnly(field)) {
            toast.warning('Field cannot be edited', {
                description: 'This field is pre-filled from existing data',
                duration: 3000,
            });
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
            toast.warning('Field cannot be edited', {
                description: 'This field is pre-filled from existing data',
                duration: 3000,
            });
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
            toast.warning('Field cannot be edited', {
                description: 'This field is pre-filled from existing data',
                duration: 3000,
            });
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

    // Error summary component
    const renderErrorSummary = () => {
        if (!submissionState.error && Object.keys(formErrors).length === 0) return null;

        const errorMessages: string[] = [];

        if (submissionState.error?.message) {
            errorMessages.push(submissionState.error.message);
        }

        return (
            <>
                {submissionState.error && (
                    <Card className="border-red-200 shadow-none">
                        <CardContent className="">
                            <div className="flex items-start">
                                <div className="mr-3 text-red-500">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    {/* <h3 className="font-medium text-red-800">{Object.keys(formErrors).length > 0 ? 'Form Errors' : 'Submission Error'}</h3> */}
                                    {submissionState.error?.message && <h3 className="font-medium text-red-800">{'Submission Error'}</h3>}
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {/* {Object.entries(formErrors).map(([field, message]) => (
                                    <li key={field} className="text-sm text-red-700">
                                        {message}
                                    </li>
                                ))} */}
                                        {errorMessages.map((message, index) => (
                                            <li key={`error-${index}`} className="text-sm text-red-700">
                                                {message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </>
        );
    };

    // Success state component
    const renderSuccessState = () => {
        if (!submissionState.success || !createdCustomerData) return null;

        return (
            <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                <Card className="mx-4 w-full max-w-md">
                    <CardContent className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                            <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">Customer Created Successfully!</h3>
                        <p className="mb-4 text-gray-600">
                            Customer ID:{' '}
                            <span className="font-mono font-semibold">{createdCustomerData.customer_code || createdCustomerData.customer_id}</span>
                        </p>
                        <p className="mb-6 text-gray-600">Redirecting to services page...</p>
                        <div className="flex justify-center">
                            <div className="h-2 w-24 rounded-full bg-gray-200">
                                <div className="h-full animate-pulse rounded-full bg-primary"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Show loading state when loading prefill data
    if (isLoadingPrefill) {
        return (
            <AuthLayout>
                <Head title="Create Customer" />
                <div className="flex min-h-screen items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                            <h2 className="text-xl font-semibold">Loading Customer Data</h2>
                            <p className="text-gray-600">Please wait while we load your existing information...</p>
                        </CardContent>
                    </Card>
                </div>
            </AuthLayout>
        );
    }

    // Check if we have any pre-filled data
    const hasPrefilledData = readOnlyFields.size > 0;

    return (
        <AuthLayout>
            <Head title="Create Customer" />
            <div className="mx-auto max-w-4xl space-y-6 px-4 pb-10 sm:px-6">
                {/* Success Overlay */}
                {renderSuccessState()}

                <div className="rounded-b-lg p-4 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Customer</h1>
                    <p className="text-md mt-1 text-gray-600">Fill in the customer details</p>
                    {/* {hasPrefilledData && (
                        <div className="mt-2 flex items-center rounded-md bg-blue-50 p-2 text-sm text-blue-700">
                            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Some fields are pre-filled from existing data and cannot be edited
                        </div>
                    )} */}
                </div>

                {/* {renderStepIndicator()} */}

                {/* Error Summary */}
                {renderErrorSummary()}

                {/* {step === 1 && ( */}
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
                                value={data.first_name ?? ''}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                placeholder="Enter first name"
                                error={formErrors.first_name}
                                readOnly={!!isFieldReadOnly('first_name')}
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
                                disabled={isFieldReadOnly('middle_name')}
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
                                disabled={isFieldReadOnly('last_name')}
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
                                disabled={isFieldReadOnly('date_of_birth')}
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
                {/* )} */}

                {/* {step === 2 && ( */}
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
                                    disabled={isFieldReadOnly('contact.mobile_no')}
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
                {/* )} */}

                {/* {step === 3 && ( */}
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
                {/* )} */}

                {/* {step === 4 && ( */}
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
                                    placeholder={occupationsLoading ? 'Loading occupations...' : 'Select occupation'}
                                    error={formErrors.occupation || (occupationError ? occupationError : undefined)}
                                    disabled={occupationsLoading || isFieldReadOnly('occupation')}
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

                    {/* <Card className="">
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
                                            required
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
                                            error={formErrors['contact_person.0.title']}
                                        />
                                        <FormInput
                                            label="First Name"
                                            required
                                            id="contact_person_first_name"
                                            value={contactPerson.first_name}
                                            onChange={(e) => updateContactPerson('first_name', e.target.value)}
                                            placeholder="Enter first name"
                                            error={formErrors['contact_person.0.first_name']}
                                        />
                                        <FormInput
                                            label="Middle Name"
                                            required
                                            id="contact_person_middle_name"
                                            value={contactPerson.middle_name}
                                            onChange={(e) => updateContactPerson('middle_name', e.target.value)}
                                            placeholder="Enter middle name"
                                            error={formErrors['contact_person.0.middle_name']}
                                        />
                                        <FormInput
                                            label="Last Name"
                                            required
                                            id="contact_person_last_name"
                                            value={contactPerson.last_name}
                                            onChange={(e) => updateContactPerson('last_name', e.target.value)}
                                            placeholder="Enter last name"
                                            error={formErrors['contact_person.0.last_name']}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormInput
                                            label="Mobile Number"
                                            required
                                            id="contact_person_mobile_no"
                                            value={contactPerson.mobile_no}
                                            onChange={(e) => updateContactPerson('mobile_no', e.target.value)}
                                            placeholder="Enter mobile number"
                                            error={formErrors['contact_person.0.mobile_no']}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card> */}
                </div>
                {/* )} */}

                <div className="flex justify-end rounded-lg bg-gray-50 p-4">
                    {/* <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1 || submissionState.isSubmitting || submissionState.isUploadingPhoto}
                        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button> */}

                    {/* {step < 4 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={submissionState.isSubmitting || submissionState.isUploadingPhoto}
                            className="flex items-center gap-2 text-white shadow-sm hover:shadow-md"
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : ( */}
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submissionState.isSubmitting || submissionState.isUploadingPhoto}
                        className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md ${
                            submissionState.isSubmitting || submissionState.isUploadingPhoto ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                    >
                        {submissionState.isSubmitting || submissionState.isUploadingPhoto ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                {submissionState.isUploadingPhoto ? 'Uploading Photo...' : 'Creating Customer...'}
                            </>
                        ) : (
                            <>
                                Submit
                                <CheckCircle className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                    {/* )} */}
                </div>
            </div>
        </AuthLayout>
    );
}
